import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import styles from './NewsletterUnsubscribe.module.css';

const NewsletterUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing unsubscribe token in URL.');
      return;
    }

    axiosInstance.get(`/users/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data?.message || 'You have been unsubscribed.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Could not process this unsubscribe link.');
      });
  }, [token]);

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1>Weekly Deals Newsletter</h1>
        {status === 'loading' && <p>Processing your request...</p>}
        {status !== 'loading' && <p className={status === 'success' ? styles.success : styles.error}>{message}</p>}
        <p><Link to="/profile">Back to your profile</Link></p>
      </div>
    </section>
  );
};

export default NewsletterUnsubscribe;
