import React from 'react';
import { Link } from 'react-router-dom';
import styles from './EmptyState.module.css';

const EmptyState = ({ icon = '🗂️', title, message, actionTo, actionLabel }) => (
  <div className={styles.emptyState}>
    <div className={styles.icon} aria-hidden="true">{icon}</div>
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {actionTo && actionLabel && (
      <Link to={actionTo} className={styles.action}>{actionLabel}</Link>
    )}
  </div>
);

export default EmptyState;
