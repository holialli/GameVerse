import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import axiosInstance from '../../lib/axios';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [library, setLibrary] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [adminOverview, setAdminOverview] = useState({ stats: {}, logs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const watchlistCount = useMemo(() => library.filter((g) => g.status === 'watchlist').length, [library]);
  const completedCount = useMemo(() => library.filter((g) => g.status === 'completed').length, [library]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        if (user?.role === 'admin') {
          const [statsRes, logsRes] = await Promise.all([
            axiosInstance.get('/admin/stats'),
            axiosInstance.get('/admin/audit-logs?limit=8'),
          ]);
          setAdminOverview({
            stats: statsRes.data.stats || {},
            logs: Array.isArray(logsRes.data.logs) ? logsRes.data.logs : [],
          });
          setLoading(false);
          return;
        }

        const [statsRes, libraryRes, leaderboardRes] = await Promise.all([
          userAPI.getDashboard(),
          userAPI.getLibrary(),
          userAPI.getLeaderboardPreview(),
        ]);

        setStats(statsRes.stats || {});
        setLibrary(Array.isArray(libraryRes.games) ? libraryRes.games : []);
        setLeaderboard(Array.isArray(leaderboardRes.leaderboard) ? leaderboardRes.leaderboard : []);
      } catch (err) {
        setError(err.message || 'Failed to load your dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className={styles.state}>Loading your hub...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  if (user?.role === 'admin') {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h1>Admin Dashboard</h1>
          <p>Operational summary, trust signals, and recent actions at a glance.</p>
          <div className={styles.heroActions}>
            <Link to="/admin" className={styles.cta}>Open Admin Center</Link>
            <Link to="/profile" className={styles.ghost}>View Admin Profile</Link>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          <article className={styles.kpiCard}><h3>Total Users</h3><p>{adminOverview.stats.totalUsers || 0}</p></article>
          <article className={styles.kpiCard}><h3>Pending Complaints</h3><p>{adminOverview.stats.pendingFeedbackCount || 0}</p></article>
          <article className={styles.kpiCard}><h3>Awaiting Event Results</h3><p>{adminOverview.stats.awaitingEventResultCount || 0}</p></article>
          <article className={styles.kpiCard}><h3>Weekly Actions</h3><p>{adminOverview.stats.recentAuditCount || 0}</p></article>
        </div>

        <article className={styles.panel}>
          <h2>Recent Activity</h2>
          {adminOverview.logs.length === 0 ? <p className={styles.empty}>No recent admin activity.</p> : (
            <ul className={styles.list}>
              {adminOverview.logs.map((entry) => (
                <li key={entry._id} className={styles.row}>
                  <span>{entry.action.replace(/_/g, ' ')}</span>
                  <span className={styles.badge}>{new Date(entry.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    );
  }

  const topBadges = Array.isArray(user?.badges) ? user.badges.slice(0, 4) : [];

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <h1>Player Dashboard</h1>
        <p>Welcome back, {user?.name || 'Player'}. Track progress, unlock badges, and discover your next obsession.</p>
        <div className={styles.heroActions}>
          <Link to="/games" className={styles.cta}>Open Game Radar</Link>
          <Link to="/discovery" className={styles.ghost}>Launch Discovery Oracle</Link>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <h3>Library</h3>
          <p>{stats?.librarySize || 0}</p>
        </article>
        <article className={styles.kpiCard}>
          <h3>Watchlist</h3>
          <p>{watchlistCount}</p>
        </article>
        <article className={styles.kpiCard}>
          <h3>Completed</h3>
          <p>{completedCount}</p>
        </article>
        <article className={styles.kpiCard}>
          <h3>Weekly Playtime</h3>
          <p>{stats?.playtimeThisWeek || 0}h</p>
        </article>
        <article className={styles.kpiCard}>
          <h3>Level</h3>
          <p>{stats?.level || 1}</p>
        </article>
        <article className={styles.kpiCard}>
          <h3>XP</h3>
          <p>{stats?.xp || 0}</p>
        </article>
      </div>

      <div className={styles.grid}>
        <article className={styles.panel}>
          <h2>Recent Badges</h2>
          {topBadges.length === 0 ? <p className={styles.empty}>Start tracking games to unlock badges.</p> : (
            <ul className={styles.list}>
              {topBadges.map((badge, idx) => (
                <li key={`${badge.name}-${idx}`} className={styles.row}>
                  <span>{badge.name}</span>
                  <span className={styles.badge}>{badge.tier || 'minor'}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <h2>Recently Tracked Games</h2>
          {library.length === 0 ? (
            <p className={styles.empty}>No games tracked yet. Add a few from Game Radar to build your profile.</p>
          ) : (
            <ul className={styles.list}>
              {library.slice(0, 6).map((g) => (
                <li key={`${g.rawgId}-${g.status}`} className={styles.row}>
                  <span>{g.title}</span>
                  <span className={styles.badge}>{g.status}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <h2>Community Top Players</h2>
          {leaderboard.length === 0 ? (
            <p className={styles.empty}>Leaderboard data will appear as players track sessions.</p>
          ) : (
            <ul className={styles.list}>
              {leaderboard.map((entry, idx) => (
                <li key={entry.userId || idx} className={styles.row}>
                  <span>#{idx + 1} {entry.username}</span>
                  <span className={styles.badge}>L{entry.level} • {entry.xp} XP</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
};

export default Dashboard;
