import React, { useState, useEffect } from 'react';
import styles from './News.module.css'; // CSS Module
import axiosInstance from '../../lib/axios';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [rankFilter, setRankFilter] = useState('hot');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const safeExternalUrl = (value) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      return parsed.toString();
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axiosInstance.get('/news/trending');
        const mapped = Array.isArray(res?.data?.articles) ? res.data.articles : [];

        setArticles(mapped);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load gaming news');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []); // Empty array means this runs once on mount

  // Handle loading state 
  if (isLoading) {
    return (
      <section className="section">
        <div className="section-header">
          <h1 className="section-title">News & Updates</h1>
          <p className="section-desc">Loading fresh stories...</p>
        </div>
      </section>
    );
  }

  // Handle error state 
  if (error) {
    return (
      <section className="section">
        <div className="section-header">
          <h1 className="section-title">News & Updates</h1>
          <p className={`${styles.errorText} section-desc`}>
            Error: {error}
          </p>
        </div>
      </section>
    );
  }

  const now = Date.now();
  const threshold = timeFilter === '24h'
    ? now - 24 * 60 * 60 * 1000
    : timeFilter === '7d'
      ? now - 7 * 24 * 60 * 60 * 1000
      : 0;

  const scored = articles
    .filter((article) => {
      if (!threshold) return true;
      const createdAt = article?.createdAt ? new Date(article.createdAt).getTime() : 0;
      return createdAt >= threshold;
    })
    .sort((a, b) => {
      if (rankFilter === 'trending') return (Number(b.reactions || 0) + Number(b.comments || 0)) - (Number(a.reactions || 0) + Number(a.comments || 0));
      if (rankFilter === 'controversial') return Number(b.comments || 0) - Number(a.comments || 0);
      return Number(b.hotScore || 0) - Number(a.hotScore || 0);
    })
    .slice(0, 8);

  return (
    <section className="section">
      <div className="section-header">
        <h1 className="section-title">News & Updates</h1>
        <p className="section-desc">Live hot stories ranked by community activity and recency.</p>
      </div>

      <div className={styles.filterRow}>
        <label>
          Time
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="all">All time</option>
          </select>
        </label>
        <label>
          Rank
          <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
            <option value="hot">Hot</option>
            <option value="trending">Trending</option>
            <option value="controversial">Controversial</option>
          </select>
        </label>
      </div>

      <div className={styles.newsGrid}>
        {scored.map((article) => {
          const tags = Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '—');
          const externalUrl = safeExternalUrl(article.url);

          const formatReactions = (r) => {
            if (r == null) return 0;
            if (typeof r === 'number') return r;
            if (typeof r === 'object') {
              // common shape: { likes: n, dislikes: n }
              if ('likes' in r || 'dislikes' in r) {
                const likes = Number(r.likes || 0);
                const dislikes = Number(r.dislikes || 0);
                return likes + dislikes;
              }
              // fallback: sum numeric values
              return Object.values(r).reduce((acc, v) => acc + (typeof v === 'number' ? v : Number(v) || 0), 0);
            }
            return String(r);
          };

          return (
            <article key={article.id} className={styles.newsItem}>
              <h2 className="card-title">{article.title}</h2>
              <p className="card-meta">Tags: {tags}</p>
              <div className={styles.metricsRow}>
                <span className={styles.metricPill}>🔥 Hot Score {article.hotScore || 0}</span>
                <span className={styles.metricPill}>💬 {article.comments || 0} comments</span>
                <span className={styles.metricPill}>⚡ {formatReactions(article.reactions)} reactions</span>
              </div>
              <p>{(article.body || '').substring(0, 170)}...</p>
              <div className={styles.sourceRow}>
                {externalUrl ? (
                  <>
                    <a href={externalUrl} target="_blank" rel="noopener noreferrer">Source: {article.source || 'External'}</a>
                    <a href={externalUrl} target="_blank" rel="noopener noreferrer" className={styles.readMore}>Read More</a>
                  </>
                ) : (
                  <small>Source: {article.source || 'Unknown'}</small>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default News;