import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import SEO from '../../components/SEO/SEO';
import styles from './Leaderboard.module.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get('/users/leaderboard/full');
        setLeaderboard(Array.isArray(res.data.leaderboard) ? res.data.leaderboard : []);
      } catch (err) {
        setError('Failed to load the leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className={styles.page}>
      <SEO
        title="Leaderboard"
        description="See who's leading GameVerse by XP, level, and badges earned."
        url="https://game-verse.tech/leaderboard"
      />
      <header className={styles.header}>
        <h1>Leaderboard</h1>
        <p>Top GameVerse players ranked by XP.</p>
      </header>

      {loading ? (
        <div className={styles.status}>Loading...</div>
      ) : error ? (
        <div className={styles.status}>{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className={styles.status}>No ranked players yet.</div>
      ) : (
        <ol className={styles.list}>
          {leaderboard.map((entry, idx) => (
            <li key={entry._id || idx} className={styles.row}>
              <span className={styles.rank}>#{idx + 1}</span>
              {entry.avatar ? (
                <img src={entry.avatar} alt={entry.username} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>{(entry.name || entry.username || 'U')[0]}</div>
              )}
              <div className={styles.identity}>
                {entry.username ? (
                  <Link to={`/u/${entry.username}`}>{entry.name || entry.username}</Link>
                ) : (
                  <span>{entry.name || 'Player'}</span>
                )}
                <span className={styles.level}>Level {entry.level || 1}</span>
              </div>
              <span className={styles.xp}>{entry.xp || 0} XP</span>
              <span className={styles.badgeCount}>{Array.isArray(entry.badges) ? entry.badges.length : 0} badges</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default Leaderboard;
