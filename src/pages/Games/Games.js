import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './Games.module.css';
import { gameAPI, userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const COMMON_GENRES = [
  'Action',
  'Adventure',
  'RPG',
  'Shooter',
  'Battle Royale',
  'Sports',
  'Strategy',
  'Simulation',
  'Racing',
  'Puzzle',
  'Sandbox',
  'Indie',
  'Horror',
];

const COMMON_PLATFORMS = [
  'PC',
  'PlayStation',
  'Xbox',
  'Nintendo Switch',
  'Nintendo',
  'Mobile',
  'Steam Deck',
  'Linux',
  'MacOS',
];

const Games = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [games, setGames] = useState([]);
  const [trackedById, setTrackedById] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refreshTrackedGames = useCallback(async () => {
    try {
      const libraryRes = await userAPI.getLibrary();
      const libraryGames = Array.isArray(libraryRes?.games) ? libraryRes.games : [];
      const next = libraryGames.reduce((acc, item) => {
        acc[String(item.rawgId)] = item.status || 'library';
        return acc;
      }, {});
      setTrackedById(next);
    } catch (err) {
      // Non-blocking for page usage.
    }
  }, []);

  const runSearch = useCallback(async (term = '') => {
    const query = (term || '').trim();
    const genreParam = selectedGenre !== 'all' && selectedGenre !== 'other' ? selectedGenre : '';
    const platformParam = selectedPlatform !== 'all' && selectedPlatform !== 'other' ? selectedPlatform : '';

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await gameAPI.getGames({
        search: query,
        genre: genreParam,
        platform: platformParam,
        page: 1,
      });
      setGames(Array.isArray(response.games) ? response.games : []);
      if (response.warning) {
        setMessage(response.warning);
      }
    } catch (err) {
      setError(err.message || 'Failed to load global game radar');
    } finally {
      setLoading(false);
    }
  }, [selectedGenre, selectedPlatform]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      runSearch('');
      refreshTrackedGames();
    }
  }, [refreshTrackedGames, runSearch, user?.role]);

  const genres = useMemo(() => ['all', ...COMMON_GENRES, 'other'], []);

  const platforms = useMemo(() => ['all', ...COMMON_PLATFORMS, 'other'], []);

  const filteredGames = useMemo(() => games
    .filter((game) => Boolean(game.title))
    .sort((a, b) => {
      const userDelta = Number(b.usersOverall || 0) - Number(a.usersOverall || 0);
      if (userDelta !== 0) return userDelta;
      return Number(b.popularityScore || 0) - Number(a.popularityScore || 0);
    }), [games]);

  const addToList = async (game, status) => {
    try {
      setSavingId(`${game.rawgId}-${status}`);
      setError('');

      const trackedStatus = trackedById[String(game.rawgId)];
      if (trackedStatus === status) {
        setMessage(`${game.title} is already in your ${status}.`);
        return;
      }

      const result = await userAPI.addOrUpdateLibraryGame({
        rawgId: game.rawgId,
        rawgSlug: game.rawgSlug,
        title: game.title,
        coverUrl: game.coverUrl,
        status,
      });

      if (result?.alreadyExists) {
        setMessage(result.message || `${game.title} is already in your ${status}.`);
        return;
      }

      if (result?.message && /already in/i.test(result.message)) {
        setMessage(result.message);
        return;
      }

      if (result?.error) {
        setError(result.error);
        return;
      }

      setTrackedById((prev) => ({ ...prev, [String(game.rawgId)]: status }));

      setMessage(`${game.title} added to ${status}.`);
    } catch (err) {
      setError(err.message || `Could not add ${game.title}`);
    } finally {
      setSavingId(null);
    }
  };

  if (user?.role === 'admin') {
    return (
      <section className={styles.container}>
        <h1>Game Radar</h1>
        <p className={styles.adminInfo}>
          Admin accounts now focus on moderation and review. Player game tracking is available for normal users only.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h1>Global Game Radar</h1>
        <p>Track trending hits, filter the results, and add games to your library or watchlist instantly.</p>
      </div>

      <form
        className={styles.searchBar}
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(search);
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Try: Fortnite, Elden Ring, Valorant..."
        />
        <button type="submit" disabled={loading}>{loading ? 'Scanning...' : 'Run Radar'}</button>
      </form>

      <div className={styles.filtersRow}>
        <label>
          Genre
          <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre === 'all' ? 'All Genres' : genre === 'other' ? 'Other Genres' : genre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Platform
          <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform === 'all' ? 'All Platforms' : platform === 'other' ? 'Other Platforms' : platform}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Scanning live game catalogs...</div>
      ) : filteredGames.length === 0 ? (
        <div className={styles.empty}>No results yet. Try another search keyword.</div>
      ) : (
        <div className={styles.gamesList}>
          {filteredGames.map((game) => (
            <article key={`${game.source}-${game.rawgId}`} className={styles.gameCard}>
              <div className={styles.coverWrap}>
                {game.coverUrl ? (
                  <img src={game.coverUrl} alt={game.title} className={styles.gameImage} />
                ) : (
                  <div className={styles.noCover}>No Cover</div>
                )}
              </div>

              <div className={styles.gameInfo}>
                <h3>{game.title}</h3>
                <p className={styles.genre}>{game.genre}</p>
                <p className={styles.description}>{game.description}</p>

                <div className={styles.meta}>
                  <span>{game.source}</span>
                  <span>Catalog: {game.source === 'RAWG' ? 'RAWG Community' : (game.owner || 'Global Catalog')}</span>
                  <span>Rating {Number(game.rating || 0).toFixed(1)}</span>
                </div>

                <div className={styles.metaSecondary}>
                  <span>Popularity {Number(game.popularityScore || 0).toFixed(1)}</span>
                  <span>{Number(game.usersOverall || 0).toLocaleString()} users</span>
                </div>

                <div className={styles.platforms}>
                  {(game.platforms || []).slice(0, 4).map((p) => (
                    <span key={`${game.rawgId}-${p}`} className={styles.platformBadge}>{p}</span>
                  ))}
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.addBtn}
                    onClick={() => addToList(game, 'library')}
                    disabled={savingId !== null || trackedById[String(game.rawgId)] === 'library'}
                  >
                    {trackedById[String(game.rawgId)] === 'library'
                      ? 'In Library'
                      : (savingId === `${game.rawgId}-library` ? 'Adding...' : 'Add to Library')}
                  </button>
                  <button
                    className={styles.watchBtn}
                    onClick={() => addToList(game, 'watchlist')}
                    disabled={savingId !== null || trackedById[String(game.rawgId)] === 'watchlist'}
                  >
                    {trackedById[String(game.rawgId)] === 'watchlist'
                      ? 'In Watchlist'
                      : (savingId === `${game.rawgId}-watchlist` ? 'Adding...' : 'Add to Watchlist')}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Games;
