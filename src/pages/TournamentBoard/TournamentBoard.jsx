import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './TournamentBoard.module.css';
import axiosInstance from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';

const prettyDate = (value) => {
  if (!value) return 'TBD';
  return new Date(value).toLocaleString();
};

const buildGmtOptions = () => {
  const options = [];
  for (let offset = -12; offset <= 14; offset += 1) {
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset).toString().padStart(2, '0');
    options.push(`GMT${sign}${abs}:00`);
  }
  return options;
};

const parseOffsetMinutes = (gmtLabel) => {
  const match = String(gmtLabel || '').match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * (hours * 60 + minutes);
};

const buildUtcIso = (dateValue, timeValue, gmtLabel) => {
  if (!dateValue || !timeValue) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue))) return null;
  if (!/^\d{2}:\d{2}$/.test(String(timeValue))) return null;

  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  if (year < 2000 || year > 2100) return null;

  const offsetMinutes = parseOffsetMinutes(gmtLabel);
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - (offsetMinutes * 60 * 1000);
  return new Date(utcMillis).toISOString();
};

const GMT_OPTIONS = buildGmtOptions();

const TournamentBoard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [joiningId, setJoiningId] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Tournament',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: 'GMT+00:00',
    prizePool: '',
    pointsAwarded: '',
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/events');
      const loaded = Array.isArray(res.data?.events) ? res.data.events : [];
      setEvents(loaded);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    return {
      upcomingEvents: events.filter((e) => !e.winner && (!e.scheduledStartTime || new Date(e.scheduledStartTime) >= now)),
      pastEvents: events.filter((e) => e.winner || (e.scheduledEndTime && new Date(e.scheduledEndTime) < now)),
    };
  }, [events]);

  const isParticipant = (event) => {
    const userId = String(user?._id || user?.id || '');
    if (!userId) return false;
    const participantIds = Array.isArray(event?.participantIds) ? event.participantIds.map((id) => String(id)) : [];
    return participantIds.includes(userId);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Login required to create tournaments.');
      return;
    }

    try {
      const title = String(form.title || '').trim();
      const description = String(form.description || '').trim();
      const category = String(form.category || '').trim();
      const prizePool = String(form.prizePool || '').trim();
      const pointsAwarded = Number(form.pointsAwarded);

      if (!title || !description || !category || !form.startDate || !form.startTime || !form.endDate || !form.endTime || !form.timezone || !prizePool || String(form.pointsAwarded).trim() === '') {
        setError('Please fill in all tournament request fields.');
        return;
      }

      const scheduledStartTime = buildUtcIso(form.startDate, form.startTime, form.timezone);
      const scheduledEndTime = buildUtcIso(form.endDate, form.endTime, form.timezone);

      if (!scheduledStartTime || !scheduledEndTime) {
        setError('Please enter valid date/time values.');
        return;
      }

      if (new Date(scheduledEndTime) <= new Date(scheduledStartTime)) {
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

      const payload = {
        title,
        description,
        category,
        scheduledStartTime,
        scheduledEndTime,
        prizePool,
        pointsAwarded,
      };
      const res = await axiosInstance.post('/events/request', payload);
      setMessage(res.data?.message || 'Tournament request submitted for admin approval.');
      setForm({
        title: '',
        description: '',
        category: 'Tournament',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        timezone: 'GMT+00:00',
        prizePool: '',
        pointsAwarded: '',
      });
      setShowCreateBox(false);
      await loadEvents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit tournament request');
    } finally {
      setCreating(false);
    }
  };

  const onJoin = async (eventId) => {
    if (!user) {
      setError('Login required to join tournaments.');
      return;
    }

    try {
      setJoiningId(eventId);
      setError('');
      setMessage('');
      const res = await axiosInstance.post(`/events/${eventId}/join-request`);
      setMessage(res.data?.message || 'Join request submitted for admin approval.');
      await loadEvents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit join request');
    } finally {
      setJoiningId('');
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Tournament Board</h1>
        <p>Track upcoming events, featured tournaments, and recently crowned champions.</p>
        {user ? (
          <button
            type="button"
            className={styles.openCreateBtn}
            onClick={() => setShowCreateBox((prev) => !prev)}
          >
            {showCreateBox ? 'Close Request Box' : 'Create Tournament Request'}
          </button>
        ) : null}
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      {user && showCreateBox ? (
        <form className={styles.createForm} onSubmit={onCreate}>
          <h2>Create Tournament Request</h2>
          <div className={styles.formGrid}>
            <label>
              Tournament Title
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. RL 1v1"
                required
              />
            </label>
            <label>
              Category
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
            </label>
            <label>
              Start Date
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </label>
            <label>
              Start Time
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </label>
            <label>
              End Date
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </label>
            <label>
              End Time
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </label>
            <label>
              Timezone
              <select
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              >
                {GMT_OPTIONS.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </label>
            <label>
              Prize Pool
              <input
                type="text"
                value={form.prizePool}
                onChange={(e) => setForm((prev) => ({ ...prev, prizePool: e.target.value }))}
                placeholder="e.g. 100 PKR"
                required
              />
            </label>
            <label>
              Points Awarded
              <input
                type="number"
                min="0"
                value={form.pointsAwarded}
                onChange={(e) => setForm((prev) => ({ ...prev, pointsAwarded: e.target.value }))}
                placeholder="e.g. 100"
                required
              />
            </label>
          </div>
          <label>
            Tournament Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe rules, format, and requirements"
              required
            />
          </label>
          <p className={styles.formHint}>Times are interpreted in your selected timezone first, then converted and stored in UTC.</p>
          <button type="submit" disabled={creating}>{creating ? 'Submitting...' : 'Submit Request'}</button>
        </form>
      ) : null}

      {loading && <p>Loading events...</p>}

      {!loading && !error && events.length === 0 && (
        <div className={styles.empty}>No events scheduled yet.</div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Upcoming & Active</h2>
          <div className={styles.grid}>
            {upcomingEvents.map((event) => (
              <article key={event._id} className={`${styles.card} ${event.isFeatured ? styles.featured : ''}`}>
                <h3>{event.title}</h3>
                <p><strong>Category:</strong> {event.category || 'Tournament'}</p>
                <p><strong>Starts:</strong> {prettyDate(event.scheduledStartTime)}</p>
                <p><strong>Ends:</strong> {prettyDate(event.scheduledEndTime)}</p>
                <p><strong>Participants:</strong> {event.participantCount}</p>
                <p><strong>Prize:</strong> {event.prizePool || 'TBD'}</p>
                <p><strong>Points Reward:</strong> {event.pointsAwarded || 0}</p>
                <p><strong>Status:</strong> {event.status}</p>
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
                        ? 'Submitting...'
                        : event.status === 'completed'
                          ? 'Completed'
                          : 'Join (Admin Approval Required)'}
                  </button>
                ) : null}
              </article>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>Past Results</h2>
          <div className={styles.grid}>
            {pastEvents.map((event) => (
              <article key={event._id} className={styles.card}>
                <h3>{event.title}</h3>
                <p><strong>Category:</strong> {event.category || 'Tournament'}</p>
                <p><strong>Ended:</strong> {prettyDate(event.scheduledEndTime)}</p>
                <p><strong>Participants:</strong> {event.participantCount}</p>
                <p><strong>Winner:</strong> {event.winner?.username || 'Pending validation'}</p>
                <p><strong>Awarded Points:</strong> {event.pointsAwarded || 0}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default TournamentBoard;
