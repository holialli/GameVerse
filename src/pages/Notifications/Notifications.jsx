import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import SEO from '../../components/SEO/SEO';
import styles from './Notifications.module.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/notifications?limit=50');
      setNotifications(Array.isArray(res.data.notifications) ? res.data.notifications : []);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      // Non-blocking.
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      // Non-blocking.
    }
  };

  return (
    <section className={styles.page}>
      <SEO title="Notifications" description="Your GameVerse notification history." url="https://game-verse.tech/notifications" />
      <div className={styles.header}>
        <h1>Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button type="button" className={styles.markAllBtn} onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      {loading ? (
        <p className={styles.status}>Loading...</p>
      ) : error ? (
        <p className={styles.status}>{error}</p>
      ) : notifications.length === 0 ? (
        <p className={styles.status}>No notifications yet.</p>
      ) : (
        <ul className={styles.list}>
          {notifications.map((n) => (
            <li key={n._id} className={n.read ? styles.item : styles.itemUnread}>
              <div className={styles.itemContent}>
                <strong>{n.title}</strong>
                {n.message && <p>{n.message}</p>}
                <span className={styles.time}>{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <div className={styles.itemActions}>
                {n.link && <Link to={n.link} onClick={() => !n.read && markRead(n._id)}>Open</Link>}
                {!n.read && <button type="button" onClick={() => markRead(n._id)}>Mark read</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Notifications;
