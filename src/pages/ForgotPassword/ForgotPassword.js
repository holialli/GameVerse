import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const data = await forgotPassword(email);
      setStatus('success');
      setMessage(data?.message || 'If that account exists, a reset link has been sent.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Could not process request');
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1>Forgot Password</h1>
        <p>Enter your email address and we will send a reset link.</p>

        {message ? (
          <div className={status === 'success' ? styles.success : styles.error}>{message}</div>
        ) : null}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className={styles.linksRow}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </section>
  );
};

export default ForgotPassword;
