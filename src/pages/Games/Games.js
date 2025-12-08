import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './Games.module.css';
import GameForm from '../../components/GameForm/GameForm';
import { gameAPI, purchaseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Games = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [platform, setPlatform] = useState(searchParams.get('platform') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [purchasing, setPurchasing] = useState({});

  const genres = [
    'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
    'Puzzle', 'Sports', 'Horror', 'Indie', 'FPS'
  ];
  const platforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'];

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (genre) params.genre = genre;
    if (platform) params.platform = platform;
    if (sort) params.sort = sort;
    params.page = page;
    params.limit = limit;
    setSearchParams(params);
  }, [search, genre, platform, sort, page, limit, setSearchParams]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await gameAPI.getGames({
        search,
        genre,
        platform,
        sort,
        page,
        limit
      });
      setGames(response.games || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [search, genre, platform, sort, page, limit]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await gameAPI.deleteGame(gameId);
      setGames(games.filter(g => g._id !== gameId));
    } catch (err) {
      setError(err.message || 'Failed to delete game');
    }
  };

  const handleBuyGame = async (gameId) => {
    setPurchasing({ ...purchasing, [gameId]: 'buying' });
    try {
      await purchaseAPI.buyGame(gameId);
      setError('');
      alert('Game purchased successfully! Check your dashboard.');
      fetchGames();
    } catch (err) {
      setError(err.message || 'Failed to purchase game');
    } finally {
      setPurchasing({ ...purchasing, [gameId]: null });
    }
  };

  const handleRentGame = async (gameId) => {
    setPurchasing({ ...purchasing, [gameId]: 'renting' });
    try {
      await purchaseAPI.rentGame(gameId);
      setError('');
      alert('Game rented successfully! 7-day rental period starts now.');
      fetchGames();
    } catch (err) {
      setError(err.message || 'Failed to rent game');
    } finally {
      setPurchasing({ ...purchasing, [gameId]: null });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingGame(null);
    setPage(1);
    fetchGames();
  };

  const handleResetFilters = () => {
    setSearch('');
    setGenre('');
    setPlatform('');
    setSort('-createdAt');
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Games</h1>
        {user?.role === 'admin' && (
          <button 
            className={styles.addBtn} 
            onClick={() => {
              setShowForm(true);
              setEditingGame(null);
            }}
          >
            + Add Game
          </button>
        )}
      </div>

      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button 
              className={styles.closeBtn}
              onClick={() => {
                setShowForm(false);
                setEditingGame(null);
              }}
            >
              ×
            </button>
            <h2>{editingGame ? 'Edit Game' : 'Add New Game'}</h2>
            {user?.role === 'admin' && (
              <GameForm 
                game={editingGame} 
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingGame(null);
                }}
              />
            )}
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={styles.searchInput}
        />
        
        <select 
          value={genre} 
          onChange={(e) => {
            setGenre(e.target.value);
            setPage(1);
          }}
          className={styles.filterSelect}
        >
          <option value="">All Genres</option>
          {genres.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select 
          value={platform} 
          onChange={(e) => {
            setPlatform(e.target.value);
            setPage(1);
          }}
          className={styles.filterSelect}
        >
          <option value="">All Platforms</option>
          {platforms.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="-rating">Highest Rating</option>
          <option value="rating">Lowest Rating</option>
          <option value="title">Title A-Z</option>
        </select>

        {(search || genre || platform) && (
          <button 
            className={styles.resetBtn}
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading games...</div>
      ) : games.length === 0 ? (
        <div className={styles.empty}>
          <p>No games found.</p>
          {user?.role === 'admin' && (
            <button 
              className={styles.addBtn}
              onClick={() => {
                setShowForm(true);
                setEditingGame(null);
              }}
            >
              Create your first game
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.gamesList}>
            {games.map(game => (
              <div key={game._id} className={styles.gameCard}>
                {game.imageUrl && (
                  <img 
                    src={game.imageUrl} 
                    alt={game.title}
                    className={styles.gameImage}
                  />
                )}
                <div className={styles.gameInfo}>
                  <h3>{game.title}</h3>
                  <p className={styles.genre}>{game.genre}</p>
                  <p className={styles.description}>{game.description}</p>
                  
                  <div className={styles.meta}>
                    <span className={styles.rating}>⭐ {game.rating}/10</span>
                    <span className={styles.developer}>{game.developer || 'Unknown'}</span>
                  </div>

                  <div className={styles.platforms}>
                    {game.platform?.map(p => (
                      <span key={p} className={styles.platformBadge}>{p}</span>
                    ))}
                  </div>

                  {user?.role === 'admin' ? (
                    <div className={styles.actions}>
                      <button 
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingGame(game);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteGame(game._id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <button 
                        className={styles.buyBtn}
                        onClick={() => handleBuyGame(game._id)}
                        disabled={purchasing[game._id]}
                      >
                        {purchasing[game._id] === 'buying' ? 'Buying...' : `Buy $${game.buyPrice || 9.99}`}
                      </button>
                      <button 
                        className={styles.rentBtn}
                        onClick={() => handleRentGame(game._id)}
                        disabled={purchasing[game._id]}
                      >
                        {purchasing[game._id] === 'renting' ? 'Renting...' : `Rent $${game.rentPrice || 2.99}/7d`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className={styles.paginationBtn}
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className={styles.paginationBtn}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Games;
