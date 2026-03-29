import React, { useCallback, useEffect, useState } from 'react';
import styles from './Events.module.css';
import axiosInstance from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Tournament',
    scheduledStartTime: '',
    scheduledEndTime: '',
    prizePool: '',
    pointsAwarded: 0,
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/events');
      setEvents(Array.isArray(response.data?.events) ? response.data.events : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onJoin = async (eventId) => {
    setJoiningId(eventId);
    setError('');
    setMessage('');
    try {
      const response = await axiosInstance.post(`/events/${eventId}/join-request`);
      setMessage(response.data?.message || 'Joined event successfully');
      await fetchEvents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to join event');
    } finally {
      setJoiningId('');
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const title = String(form.title || '').trim();
    const description = String(form.description || '').trim();
    const category = String(form.category || '').trim();
    const prizePool = String(form.prizePool || '').trim();
    const pointsAwarded = Number(form.pointsAwarded);

    if (!title || !description || !category || !form.scheduledStartTime || !form.scheduledEndTime || !prizePool || String(form.pointsAwarded).trim() === '') {
      setError('Please fill in all tournament request fields.');
      return;
    }

    if (new Date(form.scheduledEndTime) <= new Date(form.scheduledStartTime)) {
      setError('End time must be after start time.');
      return;
    }

    if (!Number.isFinite(pointsAwarded) || pointsAwarded < 0) {
      setError('Points awarded must be a valid number greater than or equal to 0.');
      return;
    }

    setCreating(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        title,
        description,
        category,
        scheduledStartTime: form.scheduledStartTime,
        scheduledEndTime: form.scheduledEndTime,
        prizePool,
        pointsAwarded,
      };
      const response = await axiosInstance.post('/events/request', payload);
      setMessage(response.data?.message || 'Tournament request submitted');
      setForm({
        title: '',
        description: '',
        category: 'Tournament',
        scheduledStartTime: '',
        scheduledEndTime: '',
        prizePool: '',
        pointsAwarded: 0,
      });
      await fetchEvents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const isParticipant = (event) => {
    const targetId = String(user?._id || user?.id || '');
    const ids = Array.isArray(event?.participantIds)
      ? event.participantIds.map((p) => String(p || ''))
      : [];
    return targetId ? ids.includes(targetId) : false;
  };

  return (
    <section className="section">
      <div className="section-header">
        <h1 className="section-title">Events & Tournaments</h1>
        <p className="section-desc">Create tournaments, join matches, and track participant momentum.</p>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {message ? <div className={styles.success}>{message}</div> : null}

      {user ? (
        <form className={styles.createForm} onSubmit={onCreate}>
          <h2>Create Tournament</h2>
          <div className={styles.formGrid}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Tournament title"
              required
            />
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="Tournament">Tournament</option>
              <option value="Showmatch">Showmatch</option>
              <option value="Community">Community</option>
              <option value="Qualifier">Qualifier</option>
              <option value="Seasonal">Seasonal</option>
            </select>
            <input
              type="datetime-local"
              value={form.scheduledStartTime}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledStartTime: e.target.value }))}
              required
            />
            <input
              type="datetime-local"
              value={form.scheduledEndTime}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledEndTime: e.target.value }))}
              required
            />
            <input
              type="text"
              value={form.prizePool}
              onChange={(e) => setForm((prev) => ({ ...prev, prizePool: e.target.value }))}
              placeholder="Prize pool (e.g. $2,000)"
              required
            />
            <input
              type="number"
              min="0"
              value={form.pointsAwarded}
              onChange={(e) => setForm((prev) => ({ ...prev, pointsAwarded: e.target.value }))}
              placeholder="Points awarded"
              required
            />
          </div>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Event description"
            required
          />
          <button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Event'}</button>
        </form>
      ) : null}

      <div className={styles.eventsGrid}>
        {loading ? <p className={styles.state}>Loading events...</p> : null}
        {events.map((event) => (
          <article key={event._id || event.id} className={styles.eventCard}>
            <div className={styles.eventDate}>
              <span className={styles.eventDay}>
                {event.scheduledStartTime ? new Date(event.scheduledStartTime).getDate() : '--'}
              </span>
              <span className={styles.eventMonth}>
                {event.scheduledStartTime
                  ? new Date(event.scheduledStartTime).toLocaleString('en-US', { month: 'short' })
                  : 'TBD'}
              </span>
            </div>
            <div className={styles.eventBody}>
              <h2 className={styles.eventTitle}>{event.title}</h2>
              <p className={styles.eventMeta}>
                {event.category || 'Tournament'} • {event.status || 'scheduled'} • {event.participantCount || 0} participants
              </p>
              <p>{event.description || 'No description provided.'}</p>
              <p className={styles.eventMeta}>Prize: {event.prizePool || 'TBD'}</p>
              {user ? (
                <button
                  type="button"
                  className={styles.joinBtn}
                  onClick={() => onJoin(event._id)}
                  disabled={joiningId === event._id || event.status === 'completed' || isParticipant(event)}
                >
                  {isParticipant(event)
                    ? 'Already Joined'
                    : joiningId === event._id
                      ? 'Joining...'
                      : event.status === 'completed'
                        ? 'Completed'
                        : 'Request to Join'}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Events;