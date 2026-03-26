import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './Games.module.css';
import { gameAPI, userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Games = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('elden ring');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const runSearch = useCallback(async (term = search) => {
    const query = (term || '').trim();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await gameAPI.getGames({ search: query, page: 1 });
      setGames(Array.isArray(response.games) ? response.games : []);
    } catch (err) {
      setError(err.message || 'Failed to load global game radar');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      runSearch('');
    }
  }, [user?.role, runSearch]);

  const genres = useMemo(() => {
    const set = new Set(games.map((g) => g.genre).filter(Boolean));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [games]);

  const platforms = useMemo(() => {
    const set = new Set();
    games.forEach((g) => (g.platforms || []).forEach((p) => set.add(p)));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [games]);

  const filteredGames = useMemo(() => games
    .filter((game) => {
      const genreMatch = selectedGenre === 'all' || game.genre === selectedGenre;
      const platformMatch = selectedPlatform === 'all' || (game.platforms || []).includes(selectedPlatform);
      const hasCoreMetadata = Boolean(game.title && game.owner && game.coverUrl && Number.isFinite(Number(game.rating)) && Number(game.rating) > 0);
      return genreMatch && platformMatch && hasCoreMetadata;
    })
    .sort((a, b) => {
      const userDelta = Number(b.usersOverall || 0) - Number(a.usersOverall || 0);
      if (userDelta !== 0) return userDelta;
      return Number(b.popularityScore || 0) - Number(a.popularityScore || 0);
    }), [games, selectedGenre, selectedPlatform]);

  const addToList = async (game, status) => {
    try {
      setSavingId(`${game.rawgId}-${status}`);
      setError('');

      await userAPI.addOrUpdateLibraryGame({
        rawgId: game.rawgId,
        rawgSlug: game.rawgSlug,
        title: game.title,
        coverUrl: game.coverUrl,
        status,
      });

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
          runSearch();
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
            {genres.map((genre) => <option key={genre} value={genre}>{genre === 'all' ? 'All Genres' : genre}</option>)}
          </select>
        </label>
        <label>
          Platform
          <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
            {platforms.map((platform) => <option key={platform} value={platform}>{platform === 'all' ? 'All Platforms' : platform}</option>)}
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
                  <span>Owner: {game.owner}</span>
                  <span>Rating {Number(game.rating).toFixed(1)}</span>
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
                    disabled={savingId !== null}
                  >
                    {savingId === `${game.rawgId}-library` ? 'Adding...' : 'Add to Library'}
                  </button>
                  <button
                    className={styles.watchBtn}
                    onClick={() => addToList(game, 'watchlist')}
                    disabled={savingId !== null}
                  >
                    {savingId === `${game.rawgId}-watchlist` ? 'Adding...' : 'Add to Watchlist'}
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
