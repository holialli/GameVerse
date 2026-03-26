import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Admin.module.css';

const AdminPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [topUsers, setTopUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('pending');
  const [resolutionDrafts, setResolutionDrafts] = useState({});
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, feedbackRes, logsRes, maintenanceRes, announcementRes] = await Promise.allSettled([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/users'),
        axiosInstance.get(`/admin/feedback?status=${feedbackStatus}`),
        axiosInstance.get('/admin/audit-logs?limit=40'),
        axiosInstance.get('/admin/config/maintenanceMode'),
        axiosInstance.get('/admin/config/announcement'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats || {});
        setTopUsers(Array.isArray(statsRes.value.data.topUsers) ? statsRes.value.data.topUsers : []);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(Array.isArray(usersRes.value.data.users) ? usersRes.value.data.users : []);
      }
      if (feedbackRes.status === 'fulfilled') {
        setFeedback(Array.isArray(feedbackRes.value.data.feedback) ? feedbackRes.value.data.feedback : []);
      }
      if (logsRes.status === 'fulfilled') {
        setAuditLogs(Array.isArray(logsRes.value.data.logs) ? logsRes.value.data.logs : []);
      }
      if (maintenanceRes.status === 'fulfilled') {
        setMaintenanceMode(Boolean(maintenanceRes.value.data.value));
      }
      if (announcementRes.status === 'fulfilled') {
        setAnnouncement(announcementRes.value.data.value || '');
      }
    } finally {
      setLoading(false);
    }
  }, [feedbackStatus]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  if (loading) return <div className={styles.state}>Loading admin control hub...</div>;

  const handleModerate = async (id, action) => {
    const reason = window.prompt('Reason for this action:') || '';
    await axiosInstance.patch(`/admin/users/${id}/moderate`, { action, reason });
    await fetchAdminData();
  };

  const grantXp = async (id) => {
    const xpDeltaRaw = window.prompt('How much XP to grant? (negative to remove)');
    const xpDelta = Number(xpDeltaRaw);
    if (!Number.isFinite(xpDelta) || xpDelta === 0) return;
    const reason = window.prompt('Reason for XP update:') || 'Admin adjustment';
    await axiosInstance.patch(`/admin/users/${id}/xp`, { xpDelta, reason });
    await fetchAdminData();
  };

  const grantBadge = async (id) => {
    const name = window.prompt('Badge name:');
    if (!name) return;
    const tier = (window.prompt('Tier (minor | major | super):', 'minor') || 'minor').toLowerCase();
    const description = window.prompt('Badge description:') || '';
    const xpBonus = Number(window.prompt('XP bonus (optional):', '0') || 0);
    await axiosInstance.post(`/admin/users/${id}/badges`, { name, tier, description, xpBonus });
    await fetchAdminData();
  };

  const toggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const reason = window.prompt(`Reason for setting role to ${nextRole}:`) || '';
    await axiosInstance.patch(`/admin/users/${targetUser._id}/role`, { role: nextRole, reason });
    await fetchAdminData();
  };

  const resolveFeedback = async (ticketId) => {
    const resolution = (resolutionDrafts[ticketId] || '').trim();
    if (!resolution) {
      setError('Resolution notes are required.');
      return;
    }

    try {
      setBusyAction(`resolve-${ticketId}`);
      setError('');
      await axiosInstance.patch(`/admin/feedback/${ticketId}/resolve`, { resolution });
      setFeedback((prev) => prev.map((item) => (
        item._id === ticketId
          ? { ...item, status: 'resolved', resolution }
          : item
      )));
      setEditingTicketId(null);
      setResolutionDrafts((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not resolve ticket');
    } finally {
      setBusyAction('');
    }
  };

  const toggleMaintenance = async () => {
    const nextValue = !maintenanceMode;
    try {
      setBusyAction('maintenance');
      setError('');
      await axiosInstance.patch('/admin/config/maintenanceMode', { value: nextValue });
      setMaintenanceMode(nextValue);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not update maintenance mode');
    } finally {
      setBusyAction('');
    }
  };

  const saveAnnouncement = async () => {
    try {
      setBusyAction('announcement');
      setError('');
      await axiosInstance.patch('/admin/config/announcement', { value: announcement });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save announcement');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1>Admin Control Hub</h1>
          <p>Moderation, trust & safety, event outcomes, and platform state from one command center.</p>
        </div>
        <button className={styles.primaryBtn} onClick={toggleMaintenance} disabled={busyAction === 'maintenance'}>
          {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
        </button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.stats}>
        <article className={styles.card}><h3>Total Users</h3><p>{stats.totalUsers || 0}</p></article>
        <article className={styles.card}><h3>Active Users</h3><p>{stats.activeUsers || 0}</p></article>
        <article className={styles.card}><h3>Pending Complaints</h3><p>{stats.pendingFeedbackCount || 0}</p></article>
        <article className={styles.card}><h3>Awaiting Event Results</h3><p>{stats.awaitingEventResultCount || 0}</p></article>
        <article className={styles.card}><h3>Shadow Bans</h3><p>{stats.shadowBannedUsers || 0}</p></article>
        <article className={styles.card}><h3>Weekly Admin Actions</h3><p>{stats.recentAuditCount || 0}</p></article>
      </div>

      <div className={styles.grid}>
        <article className={styles.panel}>
          <h2>User Moderation</h2>
          {users.length === 0 ? <p className={styles.empty}>No users found.</p> : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Level</th>
                  <th>Violations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 12).map((u) => (
                  <tr key={u._id}>
                    <td>{u.username || u.name || 'user'}</td>
                    <td>{u.isShadowBanned ? 'Shadowbanned' : (u.isActive === false ? 'Banned' : 'Active')}</td>
                    <td>L{u.level || 1} • {u.xp || 0} XP</td>
                    <td>{u.violationCount || 0}</td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => handleModerate(u._id, 'warn')}>Warn</button>
                        <button onClick={() => handleModerate(u._id, u.isActive === false ? 'unban' : 'ban')}>
                          {u.isActive === false ? 'Unban' : 'Ban'}
                        </button>
                        <button onClick={() => handleModerate(u._id, u.isShadowBanned ? 'unshadowban' : 'shadowban')}>
                          {u.isShadowBanned ? 'Unshadow' : 'Shadowban'}
                        </button>
                        <button onClick={() => grantXp(u._id)}>Grant XP</button>
                        <button onClick={() => grantBadge(u._id)}>Grant Badge</button>
                        <button onClick={() => toggleRole(u)}>{u.role === 'admin' ? 'Set User' : 'Set Admin'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className={styles.panel}>
          <h2>Complaints & Feedback</h2>
          <div className={styles.inlineControls}>
            <button
              className={feedbackStatus === 'pending' ? styles.tabActive : styles.tabBtn}
              onClick={() => setFeedbackStatus('pending')}
            >
              Pending
            </button>
            <button
              className={feedbackStatus === 'resolved' ? styles.tabActive : styles.tabBtn}
              onClick={() => setFeedbackStatus('resolved')}
            >
              Resolved
            </button>
          </div>
          {feedback.length === 0 ? <p className={styles.empty}>No pending tickets.</p> : (
            <ul className={styles.ticketList}>
              {feedback.map((f) => (
                <li key={f._id} className={styles.ticket}>
                  <div>
                    <strong>{f.subject || 'General Support'}</strong>
                    <p>{f.message}</p>
                    <small>{f.name} • {f.email}</small>
                    {f.status === 'resolved' && f.resolution ? (
                      <p className={styles.resolutionNote}>Resolution: {f.resolution}</p>
                    ) : null}

                    {f.status !== 'resolved' && editingTicketId === f._id ? (
                      <div className={styles.resolutionBox}>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={resolutionDrafts[f._id] || ''}
                          onChange={(e) => setResolutionDrafts((prev) => ({ ...prev, [f._id]: e.target.value }))}
                          placeholder="Write resolution notes for the reporting user"
                        />
                        <div className={styles.resolutionActions}>
                          <button
                            type="button"
                            onClick={() => resolveFeedback(f._id)}
                            disabled={busyAction === `resolve-${f._id}`}
                          >
                            {busyAction === `resolve-${f._id}` ? 'Saving...' : 'Save Resolution'}
                          </button>
                          <button
                            type="button"
                            className={styles.ghostBtn}
                            onClick={() => setEditingTicketId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {f.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTicketId(f._id);
                        setResolutionDrafts((prev) => ({
                          ...prev,
                          [f._id]: prev[f._id] || '',
                        }));
                      }}
                    >
                      Resolve
                    </button>
                  ) : <span className={styles.resolvedTag}>Resolved</span>}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <h2>Platform Controls</h2>
          <div className={styles.announcementBox}>
            <label htmlFor="announcement">Global Announcement</label>
            <textarea
              id="announcement"
              rows={4}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Enter a site-wide message..."
            />
            <button onClick={saveAnnouncement} disabled={busyAction === 'announcement'}>
              {busyAction === 'announcement' ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
          <p className={styles.metaText}>Maintenance mode is <strong>{maintenanceMode ? 'ON' : 'OFF'}</strong>.</p>
        </article>

        <article className={styles.panel}>
          <h2>Top Players Snapshot</h2>
          {topUsers.length === 0 ? <p className={styles.empty}>No leaderboard data yet.</p> : (
            <ul className={styles.playerList}>
              {topUsers.map((p, idx) => (
                <li key={p.userId || idx}>
                  <span>#{idx + 1} {p.username}</span>
                  <span>L{p.level} • {p.xp} XP • {p.badgesCount} badges</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panelWide}>
          <h2>Recent Admin Actions</h2>
          {auditLogs.length === 0 ? <p className={styles.empty}>No recent activity logged.</p> : (
            <ul className={styles.auditList}>
              {auditLogs.slice(0, 24).map((log) => (
                <li key={log._id}>
                  <div>
                    <strong>{log.action.replace(/_/g, ' ')}</strong>
                    <p>{log.reason || 'No note provided'}</p>
                  </div>
                  <small>{new Date(log.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
};

export default AdminPage;
