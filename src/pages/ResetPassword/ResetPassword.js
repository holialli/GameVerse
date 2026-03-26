import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const data = await resetPassword(token, newPassword, confirmPassword);
      setStatus('success');
      setMessage(data?.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Could not reset password');
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1>Reset Password</h1>
        <p>Set a new password for your account.</p>

        {!token ? <div className={styles.error}>Missing reset token in URL.</div> : null}
        {message ? <div className={status === 'success' ? styles.success : styles.error}>{message}</div> : null}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={status === 'loading' || !token}>
            {status === 'loading' ? 'Saving...' : 'Reset Password'}
          </button>
        </form>

        <p className={styles.linksRow}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </section>
  );
};

export default ResetPassword;
