import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios';
import styles from './Contact.module.css';
import { useAuth } from '../../contexts/AuthContext';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Bug Report',
    message: '',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');

    try {
      await axiosInstance.post('/contact', formData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'Bug Report', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err?.response?.data?.error || 'Could not send your message. Please try again.');
    }
  };

  const loadMyTickets = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingTickets(true);
      const res = await axiosInstance.get('/contact/my');
      setTickets(Array.isArray(res?.data?.tickets) ? res.data.tickets : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load your ticket history.');
    } finally {
      setLoadingTickets(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMyTickets();
    }
  }, [isAuthenticated, loadMyTickets]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Contact & Feedback</h1>
        <p>Report issues, request features, or share complaints for admin review.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {status === 'success' && <div className={styles.success}>Message sent successfully. Admin will review it soon.</div>}
        {status === 'error' && <div className={styles.error}>{error}</div>}

        <label>
          Name
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
        </label>

        <label>
          Subject
          <select value={formData.subject} onChange={(e) => handleChange('subject', e.target.value)}>
            <option value="Bug Report">Bug Report</option>
            <option value="Game Missing">Game Missing</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Message
          <textarea
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            rows={5}
            required
          />
        </label>

        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Submit'}
        </button>
      </form>

      {isAuthenticated ? (
        <section className={styles.ticketSection}>
          <div className={styles.ticketHeader}>
            <h2>Your Complaints & Feedback</h2>
            <button type="button" onClick={loadMyTickets} disabled={loadingTickets}>
              {loadingTickets ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {tickets.length === 0 ? (
            <p className={styles.ticketEmpty}>No submitted tickets yet.</p>
          ) : (
            <ul className={styles.ticketList}>
              {tickets.map((ticket) => (
                <li key={ticket._id} className={styles.ticketItem}>
                  <div className={styles.ticketTop}>
                    <strong>{ticket.subject || 'Other'}</strong>
                    <span className={ticket.status === 'resolved' ? styles.resolved : styles.pending}>
                      {ticket.status}
                    </span>
                  </div>
                  <p>{ticket.message}</p>
                  {ticket.resolution ? <p className={styles.resolution}>Resolution: {ticket.resolution}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </section>
  );
};

export default Contact;
