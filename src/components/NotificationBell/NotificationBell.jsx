import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import styles from './NotificationBell.module.css';

const POLL_INTERVAL_MS = 60000;

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const loadUnreadCount = async () => {
    try {
      const res = await axiosInstance.get('/notifications/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Non-blocking.
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await axiosInstance.get('/notifications?limit=10');
      setNotifications(Array.isArray(res.data.notifications) ? res.data.notifications : []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Non-blocking.
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) loadNotifications();
  };

  const markRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Non-blocking.
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // Non-blocking.
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button type="button" className={styles.bellBtn} onClick={toggleOpen} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className={styles.markAllBtn} onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className={styles.empty}>No notifications yet.</p>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n) => {
                const content = (
                  <>
                    <div className={styles.itemTitle}>{n.title}</div>
                    {n.message && <div className={styles.itemMessage}>{n.message}</div>}
                  </>
                );
                return (
                  <li key={n._id} className={n.read ? styles.item : styles.itemUnread}>
                    {n.link ? (
                      <Link to={n.link} onClick={() => { setOpen(false); if (!n.read) markRead(n._id); }}>
                        {content}
                      </Link>
                    ) : (
                      <button type="button" className={styles.itemBtn} onClick={() => markRead(n._id)}>
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Link to="/notifications" className={styles.viewAll} onClick={() => setOpen(false)}>View all</Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
