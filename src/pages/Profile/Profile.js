import React, { useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios';
import styles from './Profile.module.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [games, setGames] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminLogs, setAdminLogs] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', bio: '', isPrivate: false, avatar: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [profileRes, libraryRes] = await Promise.all([
      axiosInstance.get('/users/me'),
      axiosInstance.get('/users/games/library'),
    ]);

    const p = profileRes.data;
    setProfile(p);
    setForm({
      name: p.name || '',
      username: p.username || '',
      bio: p.bio || '',
      isPrivate: !!p.isPrivate,
      avatar: p.avatar || '',
    });
    setGames(Array.isArray(libraryRes.data.games) ? libraryRes.data.games : []);

    if (p.role === 'admin') {
      const [statsRes, logsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/audit-logs?limit=20'),
      ]);
      setAdminStats(statsRes.data?.stats || null);
      setAdminLogs(Array.isArray(logsRes.data?.logs) ? logsRes.data.logs : []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await axiosInstance.patch('/users/me/profile', form);
      setMessage('Profile updated.');
      setEditing(false);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save profile changes.');
    }
  };

  if (!profile) return <div className={styles.state}>Loading profile...</div>;

  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const minorBadges = badges.filter((b) => (b.tier || 'minor') === 'minor');
  const majorBadges = badges.filter((b) => b.tier === 'major');
  const superBadges = badges.filter((b) => b.tier === 'super');

  const isAdmin = profile.role === 'admin';

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.identity}>
          {form.avatar ? <img src={form.avatar} alt="avatar" className={styles.avatar} /> : <div className={styles.avatarFallback}>{(profile.name || 'U')[0]}</div>}
          <div>
            <h1>{profile.name}</h1>
            <p>@{profile.username || 'username-not-set'}</p>
            <small>{isAdmin ? 'Administrator' : 'Player'} • Level {profile.level || 1} • {profile.xp || 0} XP</small>
          </div>
        </div>

        <button className={styles.editBtn} onClick={() => setEditing((v) => !v)}>{editing ? 'Cancel' : 'Edit Profile'}</button>
      </div>

      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {editing && (
        <form className={styles.form} onSubmit={saveProfile}>
          <label>Name<input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
          <label>Username<input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} /></label>
          <label>Avatar URL<input value={form.avatar} onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))} /></label>
          <label>Bio<textarea rows={4} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} /></label>
          <label className={styles.checkbox}><input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm((p) => ({ ...p, isPrivate: e.target.checked }))} /> Private profile</label>
          <button type="submit">Save Changes</button>
        </form>
      )}

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>{isAdmin ? 'Admin Stats' : 'Player Stats'}</h2>
          <ul>
            {!isAdmin && <li>Library games: <strong>{profile.stats?.libraryCount || 0}</strong></li>}
            {!isAdmin && <li>Watchlist games: <strong>{profile.stats?.watchlistCount || 0}</strong></li>}
            {!isAdmin && <li>Completed games: <strong>{profile.stats?.completedCount || 0}</strong></li>}
            {!isAdmin && <li>Total playtime: <strong>{profile.stats?.totalPlaytimeHrs || 0}h</strong></li>}
            {!isAdmin && <li>Event wins: <strong>{profile.stats?.eventsWon || 0}</strong></li>}
            {isAdmin && <li>Total users: <strong>{adminStats?.totalUsers || 0}</strong></li>}
            {isAdmin && <li>Pending complaints: <strong>{adminStats?.pendingFeedbackCount || 0}</strong></li>}
            {isAdmin && <li>Awaiting event results: <strong>{adminStats?.awaitingEventResultCount || 0}</strong></li>}
            {isAdmin && <li>Weekly admin actions: <strong>{adminStats?.recentAuditCount || 0}</strong></li>}
            <li>Privacy mode: <strong>{profile.isPrivate ? 'Enabled' : 'Public'}</strong></li>
          </ul>
        </article>

        <article className={styles.card}>
          <h2>Badges</h2>
          {badges.length === 0 ? <p className={styles.empty}>No badges yet. Add games and log sessions to unlock them.</p> : (
            <>
              <h3 className={styles.badgeHeading}>Super</h3>
              <ul className={styles.badges}>{superBadges.map((b, idx) => <li key={`super-${idx}`} className={styles.badgeSuper}>{b.name}</li>)}</ul>
              <h3 className={styles.badgeHeading}>Major</h3>
              <ul className={styles.badges}>{majorBadges.map((b, idx) => <li key={`major-${idx}`} className={styles.badgeMajor}>{b.name}</li>)}</ul>
              <h3 className={styles.badgeHeading}>Minor</h3>
              <ul className={styles.badges}>{minorBadges.map((b, idx) => <li key={`minor-${idx}`} className={styles.badgeMinor}>{b.name}</li>)}</ul>
            </>
          )}
        </article>
      </div>

      {!isAdmin && (
        <article className={styles.card}>
          <h2>Tracked Games</h2>
          {games.length === 0 ? <p className={styles.empty}>No tracked games yet.</p> : (
            <ul className={styles.rows}>{games.slice(0, 12).map((g) => <li key={`${g.rawgId}-${g.status}`}>{g.title} <span>{g.status}</span></li>)}</ul>
          )}
        </article>
      )}

      {isAdmin && (
        <article className={styles.card}>
          <h2>Recent Admin Activity</h2>
          {adminLogs.length === 0 ? <p className={styles.empty}>No admin activity yet.</p> : (
            <ul className={styles.rows}>{adminLogs.map((log) => <li key={log._id}>{log.action.replace(/_/g, ' ')} <span>{new Date(log.createdAt).toLocaleDateString()}</span></li>)}</ul>
          )}
        </article>
      )}
    </section>
  );
};

export default Profile;
