import React, { useEffect, useState } from 'react';
import styles from './VideoHub.module.css';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

const buildEmbedUrl = (video) => {
  if (video.platform === 'youtube') return `https://www.youtube.com/embed/${video.videoId}`;
  if (video.platform === 'twitch') return `https://player.twitch.tv/?video=${video.videoId}&parent=localhost`;
  return null;
};

const VideoHub = () => {
  const { isAuthenticated } = useAuth();
  const [videos, setVideos] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadVideos = async (nextCursor = null) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '12' });
      if (nextCursor) params.set('cursor', nextCursor);
      const res = await fetch(`${API_BASE_URL}/videos?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to load videos');

      const loaded = Array.isArray(json.videos) ? json.videos : [];
      setVideos((prev) => (nextCursor ? [...prev, ...loaded] : loaded));
      setCursor(json.nextCursor || null);
    } catch (err) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const submitVideo = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Submission failed');

      setMessage('Submitted. The video will appear after admin approval.');
      setUrl('');
    } catch (err) {
      setError(err.message || 'Failed to submit video');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Video Hub</h1>
        <p>Community gameplay clips and highlights.</p>
      </header>

      {isAuthenticated && (
        <form className={styles.submitForm} onSubmit={submitVideo}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube or Twitch video link"
            required
          />
          <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Video'}</button>
        </form>
      )}

      {!isAuthenticated && <p className={styles.hint}>Login to submit videos.</p>}
      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}
      {loading && <p>Loading videos...</p>}

      {!loading && !error && videos.length === 0 && (
        <div className={styles.empty}>No approved videos yet.</div>
      )}

      {!loading && videos.length > 0 && (
        <div className={styles.grid}>
          {videos.map((video) => {
            const embed = buildEmbedUrl(video);
            return (
              <article key={video._id} className={styles.card}>
                <div className={styles.media}>
                  {embed ? (
                    <iframe
                      src={embed}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img src={video.thumbnailUrl} alt={video.title} />
                  )}
                </div>
                <h3>{video.title}</h3>
                <p>{video.channelName || video.platform}</p>
              </article>
            );
          })}
        </div>
      )}

      {cursor && (
        <div className={styles.moreWrap}>
          <button onClick={() => loadVideos(cursor)} disabled={loading}>Load More</button>
        </div>
      )}
    </section>
  );
};

export default VideoHub;
