import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from './Games.module.css';
import { gameAPI, userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/SEO/SEO';
import SponsoredBadge from '../../components/SponsoredBadge/SponsoredBadge';

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
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(() => searchParams.get('genre') || 'all');
  const [selectedPlatform, setSelectedPlatform] = useState(() => searchParams.get('platform') || 'all');
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [totalPages, setTotalPages] = useState(1);
  const [games, setGames] = useState([]);
  const [sponsoredGames, setSponsoredGames] = useState([]);
  const [trackedById, setTrackedById] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const isFirstFilterRun = useRef(true);

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

  const runSearch = useCallback(async ({ term = '', genre = 'all', platform = 'all', page: pageParam = 1 } = {}) => {
    const query = (term || '').trim();
    const genreParam = genre !== 'all' && genre !== 'other' ? genre : '';
    const platformParam = platform !== 'all' && platform !== 'other' ? platform : '';

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await gameAPI.getGames({
        search: query,
        genre: genreParam,
        platform: platformParam,
        page: pageParam,
      });
      setGames(Array.isArray(response.games) ? response.games : []);
      setTotalPages(Math.max(1, Number(response.totalPages) || 1));
      if (response.warning) {
        setMessage(response.warning);
      }
    } catch (err) {
      setError(err.message || 'Failed to load global game radar');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the free-text search box so typing doesn't hit the API on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(handle);
  }, [search]);

  // A new search term/genre/platform is a new result set, so jump back to page 1
  // (but not on first mount, where `page` may already be seeded from the URL).
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, selectedGenre, selectedPlatform]);

  useEffect(() => {
    if (user?.role === 'admin') return;
    runSearch({ term: debouncedSearch, genre: selectedGenre, platform: selectedPlatform, page });
  }, [debouncedSearch, selectedGenre, selectedPlatform, page, user?.role, runSearch]);

  // Sponsored slots don't depend on search/filter state - fetched once, capped
  // server-side at 2, and shown pinned above the organic results.
  useEffect(() => {
    gameAPI.getSponsored()
      .then((res) => setSponsoredGames(Array.isArray(res?.games) ? res.games : []))
      .catch(() => setSponsoredGames([]));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') return;
    if (isAuthenticated) {
      refreshTrackedGames();
    } else {
      setTrackedById({});
    }
  }, [isAuthenticated, refreshTrackedGames, user?.role]);

  // Keep the URL shareable/bookmarkable without spamming browser history while typing.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch) next.set('q', debouncedSearch);
    if (selectedGenre !== 'all') next.set('genre', selectedGenre);
    if (selectedPlatform !== 'all') next.set('platform', selectedPlatform);
    if (page > 1) next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, selectedGenre, selectedPlatform, page, setSearchParams]);

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
    if (!isAuthenticated) {
      setMessage('Sign in to add games to your library or watchlist.');
      return;
    }

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
      <SEO
        title="Game Radar"
        description="Browse the GameVerse game catalog and sign in to track titles in your library or watchlist."
        url="https://game-verse.tech/games"
      />
      <div className={styles.header}>
        <h1>Global Game Radar</h1>
        <p>Track trending hits, filter the results, and add games to your library or watchlist instantly.</p>
        {!isAuthenticated && <p className={styles.publicNote}>Browse freely. Sign in to save games to your tracking list.</p>}
      </div>

      {sponsoredGames.length > 0 && (
        <div className={styles.sponsoredRow}>
          {sponsoredGames.map((game) => (
            <a
              key={`sponsored-${game.id}`}
              className={styles.sponsoredCard}
              href={game.sponsoredUrl || '#'}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              {game.coverUrl ? (
                <img src={game.coverUrl} alt={game.title} className={styles.sponsoredImage} />
              ) : (
                <div className={styles.noCover}>No Cover</div>
              )}
              <div className={styles.sponsoredInfo}>
                <SponsoredBadge />
                <h3>{game.title}</h3>
                <p className={styles.description}>{game.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      <form
        className={styles.searchBar}
        onSubmit={(e) => {
          e.preventDefault();
          setDebouncedSearch(search.trim());
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
                  {isAuthenticated ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <Link className={styles.addBtn} to="/login">Sign in to track</Link>
                      <Link className={styles.watchBtn} to="/register">Create account</Link>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && filteredGames.length > 0 && (
        <div className={styles.pagination}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default Games;
