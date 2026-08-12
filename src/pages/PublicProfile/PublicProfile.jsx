import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import SEO from '../../components/SEO/SEO';
import styles from './PublicProfile.module.css';

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    setIsPrivate(false);
    try {
      const res = await axiosInstance.get(`/users/public/${encodeURIComponent(username)}`);
      setProfile(res.data);
    } catch (err) {
      if (err?.response?.status === 403 && err?.response?.data?.isPrivate) {
        setIsPrivate(true);
      } else if (err?.response?.status === 404) {
        setError('This profile doesn\'t exist.');
      } else {
        setError('Failed to load this profile.');
      }
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) fetchProfile();
  }, [username, fetchProfile]);

  if (loading) return <div className={styles.status}>Loading...</div>;

  if (isPrivate) {
    return (
      <div className={styles.status}>
        <SEO title={`@${username} | GameVerse`} description="This profile is private." url={`https://game-verse.tech/u/${username}`} />
        <p>@{username}'s profile is private.</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.status}>
        <p className={styles.errorText}>{error || 'Profile not found.'}</p>
        <button type="button" className={styles.retryButton} onClick={fetchProfile}>Retry</button>
      </div>
    );
  }

  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const pageUrl = `https://game-verse.tech/u/${profile.username}`;
  const pageTitle = `${profile.name} (@${profile.username}) | GameVerse`;
  const pageDescription = profile.bio
    || `${profile.name} is Level ${profile.level || 1} on GameVerse with ${badges.length} badge${badges.length === 1 ? '' : 's'} earned.`;

  return (
    <section className={styles.page}>
      <SEO
        title={pageTitle}
        description={pageDescription}
        image={profile.avatar || 'https://game-verse.tech/og-image.png'}
        url={pageUrl}
        type="article"
      />

      <div
        className={styles.hero}
        style={profile.profileBanner ? { backgroundImage: `url(${profile.profileBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name}
            className={`${styles.avatar} ${profile.avatarFrame ? styles[`frame${profile.avatarFrame.charAt(0).toUpperCase()}${profile.avatarFrame.slice(1)}`] : ''}`}
          />
        ) : (
          <div className={styles.avatarFallback}>{(profile.name || 'U')[0]}</div>
        )}
        <div>
          <h1>{profile.name}</h1>
          <p className={styles.username}>@{profile.username}</p>
          <p className={styles.levelLine}>Level {profile.level || 1} &bull; {profile.xp || 0} XP</p>
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.stat}><strong>{profile.stats?.libraryCount || 0}</strong><span>Library</span></div>
        <div className={styles.stat}><strong>{profile.stats?.completedCount || 0}</strong><span>Completed</span></div>
        <div className={styles.stat}><strong>{profile.stats?.totalPlaytimeHrs || 0}h</strong><span>Playtime</span></div>
        <div className={styles.stat}><strong>{profile.stats?.eventsWon || 0}</strong><span>Event Wins</span></div>
      </div>

      {profile.stats?.topGenres?.length > 0 && (
        <p className={styles.topGenres}>Favorite genres: {profile.stats.topGenres.join(', ')}</p>
      )}

      <article className={styles.card}>
        <h2>Badges ({badges.length})</h2>
        {badges.length === 0 ? (
          <p className={styles.empty}>No badges earned yet.</p>
        ) : (
          <ul className={styles.badges}>
            {badges.map((b, idx) => (
              <li key={`${b.key}-${idx}`} className={styles[`badge${(b.tier || 'minor').charAt(0).toUpperCase()}${(b.tier || 'minor').slice(1)}`] || styles.badgeMinor}>
                {b.name}
              </li>
            ))}
          </ul>
        )}
      </article>

      <p className={styles.footerLink}><Link to="/leaderboard">View the full leaderboard &rarr;</Link></p>
    </section>
  );
};

export default PublicProfile;
