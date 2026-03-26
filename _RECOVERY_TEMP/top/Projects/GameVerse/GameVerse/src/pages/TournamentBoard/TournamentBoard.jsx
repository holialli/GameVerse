import React, { useEffect, useState } from 'react';
import styles from './TournamentBoard.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

const prettyDate = (value) => {
  if (!value) return 'TBD';
  return new Date(value).toLocaleString();
};

const TournamentBoard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/events`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || 'Failed to load events');
        setEvents(Array.isArray(json.events) ? json.events : []);
      } catch (err) {
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Tournament Board</h1>
        <p>Track upcoming events and recently finalized winners.</p>
      </header>

      {loading && <p>Loading events...</p>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && events.length === 0 && (
        <div className={styles.empty}>No events scheduled yet.</div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className={styles.grid}>
          {events.map((event) => (
            <article key={event._id} className={styles.card}>
              <h3>{event.title}</h3>
              <p><strong>Ends:</strong> {prettyDate(event.scheduledEndTime)}</p>
              <p><strong>Participants:</strong> {event.participantCount}</p>
              <p><strong>Status:</strong> {event.status}</p>
              <p><strong>Winner:</strong> {event.winner?.username || 'Pending'}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TournamentBoard;
