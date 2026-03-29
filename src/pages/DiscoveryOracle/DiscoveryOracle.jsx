import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './DiscoveryOracle.module.css';
import axiosInstance from '../../lib/axios';
import { userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

const QUICK_PROMPTS = [
  'Souls-like with strong boss design and build variety',
  'Chill farming or life-sim with low stress',
  'Shooter with tactical communication and team roles',
  'RPG where player choices change the ending',
];

const shuffleArray = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const DiscoveryOracle = () => {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [gameCards, setGameCards] = useState([]);
  const [busyGameAction, setBusyGameAction] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const bottomRef = useRef(null);
  const quickPrompts = useMemo(() => shuffleArray(QUICK_PROMPTS), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [response]);

  const titleMatches = useMemo(() => {
    const matches = response.match(/\[\[(.*?)\]\]/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.replace(/\[\[|\]\]/g, '').trim()).filter(Boolean))];
  }, [response]);

  useEffect(() => {
    const hydrate = async () => {
      if (isStreaming || !titleMatches.length) return;
      setGameCards(titleMatches.map((title) => ({ title, loading: true })));

      try {
        const res = await fetch(`${API_BASE_URL}/games/hydrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titles: titleMatches }),
        });
        if (!res.ok) throw new Error('Hydration failed');
        const data = await res.json();
        setGameCards(Array.isArray(data.games) ? data.games : []);
      } catch (err) {
        setGameCards(titleMatches.map((title) => ({ title, found: false })));
      }
    };

    hydrate();
  }, [isStreaming, titleMatches]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setResponse('');
    setError('');
    setActionMessage('');
    setGameCards([]);
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || json.message || 'Discovery request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const payload = part.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              streamedText += parsed.text;
              setResponse((prev) => prev + parsed.text);
            }
            if (parsed.error) setError(parsed.error);
          } catch (err) {
            // Ignore invalid chunk boundaries
          }
        }
      }

      if (!streamedText.trim()) {
        const fallback = await axiosInstance.post('/ai/chat', { prompt: query });
        const answer = fallback?.data?.answer || '';
        if (answer) {
          setResponse(answer);
        }
      }
    } catch (err) {
      try {
        const fallback = await axiosInstance.post('/ai/chat', { prompt: query });
        const answer = fallback?.data?.answer || '';
        if (answer) {
          setResponse(answer);
        } else {
          setError('Failed to contact AI service');
        }
      } catch (fallbackErr) {
        setError(err.message || 'Failed to contact AI service');
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const renderResponse = () => {
    if (!response) {
      return <p className={styles.emptyText}>Ask for recommendations like: "A story-heavy RPG with choices"</p>;
    }

    return response.split(/(\[\[.*?\]\])/g).map((chunk, idx) => {
      if (chunk.startsWith('[[') && chunk.endsWith(']]')) {
        return (
          <span key={idx} className={styles.tag}>
            {chunk.slice(2, -2)}
          </span>
        );
      }
      return <span key={idx}>{chunk}</span>;
    });
  };

  const addDiscoveredGame = async (game, status) => {
    if (!isAuthenticated) {
      setError('Please login first to add games to library or watchlist.');
      return;
    }

    if (!game?.rawgId) {
      setError('This recommendation is not mapped to a trackable game ID yet.');
      return;
    }

    try {
      setBusyGameAction(`${game.rawgId}-${status}`);
      setError('');
      setActionMessage('');

      const result = await userAPI.addOrUpdateLibraryGame({
        rawgId: game.rawgId,
        rawgSlug: game.rawgSlug || String(game.title || '').toLowerCase().replace(/\s+/g, '-'),
        title: game.title,
        coverUrl: game.coverUrl || game.imageUrl || null,
        status,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setActionMessage(result?.message || `${game.title} added to ${status}.`);
    } catch (err) {
      setError(err?.message || 'Failed to add game');
    } finally {
      setBusyGameAction('');
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Discovery Oracle</h1>
        <p>Get AI game recommendations and instantly map them to your catalog.</p>
      </div>

      <form onSubmit={handleSearch} className={styles.form}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="I want a game like Elden Ring but sci-fi"
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !query.trim()}>
          {isStreaming ? 'Thinking...' : 'Discover'}
        </button>
      </form>

      <div className={styles.quickRow}>
        {quickPrompts.map((item) => (
          <button key={item} type="button" className={styles.quickBtn} onClick={() => setQuery(item)}>{item}</button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {actionMessage && <div className={styles.success}>{actionMessage}</div>}

      <article className={styles.responseBox}>
        {renderResponse()}
        <div ref={bottomRef} />
      </article>

      {gameCards.length > 0 && (
        <div className={styles.grid}>
          {gameCards.map((game, idx) => {
            if (game.loading) {
              return <div key={`loading-${idx}`} className={styles.cardLoading}>Loading game card...</div>;
            }

            if (!game.found) {
              return (
                <article key={`missing-${idx}`} className={styles.cardMissing}>
                  <h3>{game.title}</h3>
                  <p>Not in catalog yet</p>
                </article>
              );
            }

            return (
              <article key={game._id || idx} className={styles.card}>
                <h3>{game.title}</h3>
                <p>{game.description || 'No description available.'}</p>
                <div className={styles.meta}>
                  <span>{game.genre || 'Unknown genre'}</span>
                  <span>Rating: {game.rating ?? 'N/A'}</span>
                </div>
                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => addDiscoveredGame(game, 'library')}
                    disabled={busyGameAction === `${game.rawgId}-library` || !game.rawgId}
                  >
                    {busyGameAction === `${game.rawgId}-library` ? 'Adding...' : 'Add to Library'}
                  </button>
                  <button
                    type="button"
                    className={styles.watchBtn}
                    onClick={() => addDiscoveredGame(game, 'watchlist')}
                    disabled={busyGameAction === `${game.rawgId}-watchlist` || !game.rawgId}
                  >
                    {busyGameAction === `${game.rawgId}-watchlist` ? 'Adding...' : 'Add to Watchlist'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DiscoveryOracle;
