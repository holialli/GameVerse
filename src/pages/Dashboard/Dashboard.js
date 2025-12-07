import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, gameAPI } from '../../services/api';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, accessToken, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userAPI.getDashboard(user.id, accessToken);
        if (!res.ok) throw new Error('Failed to load dashboard');
        const data = await res.json();
        setDashboard(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user && accessToken) fetchDashboard();
  }, [user, accessToken]);

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!dashboard) return <div className={styles.error}>No dashboard data yet.</div>;

  return (
    <div className={styles.container}>
      <h1>Welcome, {dashboard.user.name}!</h1>
      <div className={styles.stats}>
        <div>Total Games: {dashboard.stats.totalGames}</div>
        <div>Average Rating: {dashboard.stats.averageRating}</div>
      </div>
      <h2>Recent Games</h2>
      {dashboard.recentGames.length === 0 ? (
        <p className={styles.muted}>You have not added any games yet.</p>
      ) : (
        <ul className={styles.gamesList}>
          {dashboard.recentGames.map((game) => (
            <li key={game._id}>
              <strong>{game.title}</strong> ({game.genre}) - Rating: {game.rating}
            </li>
          ))}
        </ul>
      )}

      <h2>Genre Breakdown</h2>
      {dashboard.genreBreakdown.length === 0 ? (
        <p className={styles.muted}>No genre data yet.</p>
      ) : (
        <ul className={styles.genresList}>
          {dashboard.genreBreakdown.map((g) => (
            <li key={g._id}>
              {g._id}: {g.count}
            </li>
          ))}
        </ul>
      )}
      <button className={styles.logoutBtn} onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
