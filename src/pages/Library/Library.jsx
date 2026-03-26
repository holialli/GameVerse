import React, { useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios';
import { Link } from 'react-router-dom';
import styles from './Library.module.css';

const Library = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  
  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/user/games/library');
      setGames(res.data.games || []);
    } catch (err) { setError('Failed to load library data.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLibrary(); }, []);

  const handleUpdateStatus = async (rawgId, newStatus) => {
    try {
      await axiosInstance.post('/user/games', { rawgId, status: newStatus });
      fetchLibrary();
    } catch(e) { alert('Failed to update status'); }
  };

  const handleLogSession = async (rawgId) => {
    const mins = prompt('Enter manual minutes played (or leave blank for 30):', '30');
    if (mins === null) return;
    try {
      await axiosInstance.post(`/user/games/${rawgId}/session`, { minutesPlayed: parseInt(mins) || 30 });
      fetchLibrary();
    } catch(e) { alert('Failed to log session'); }
  };

  const handleRemove = async (rawgId) => {
    if (!window.confirm('Remove this game from your tracking?')) return;
    try {
      await axiosInstance.delete(`/user/games/${rawgId}`);
      fetchLibrary();
    } catch(e) { alert('Failed to remove game'); }
  };

  const filteredGames = filter === 'all' ? games : games.filter(g => g.status === filter);
  if (loading) return <div>Loading Library...</div>;

  return (
    <div className={styles.libraryContainer}>
      <h1>Your Tracking Hub</h1>
      <div className={styles.filterTabs}>
        {['all', 'library', 'watchlist', 'completed', 'dropped'].map(f => (
          <button key={f} className={filter === f ? styles.active : ''} onClick={() => setFilter(f)}>
            {f} ({filter === 'all' && f !== 'all' ? games.filter(g=>g.status===f).length : (filter === f ? filteredGames.length : games.filter(g=>g.status===f).length)})
          </button>
        ))}
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      {filteredGames.length === 0 ? <p>No games found here.</p> : (
        <div className={styles.grid}>
          {filteredGames.map(game => (
            <div key={game.rawgId} className={styles.gameCard}>
              <img src={game.coverUrl || '/placeholder.png'} alt={game.title} className={styles.cover} />
              <div className={styles.cardInfo}>
                <Link to={`/games/${game.rawgSlug || game.rawgId}`}>{game.title}</Link>
                <span>🕒 {Math.floor(game.playtimeMinutes / 60)}h {game.playtimeMinutes % 60}m</span>
                <div className={styles.actions}>
                  <button onClick={() => handleLogSession(game.rawgId)}>Log Session</button>
                  <select value={game.status} onChange={(e) => handleUpdateStatus(game.rawgId, e.target.value)}>
                    <option value="library">Library (Playing)</option>
                    <option value="watchlist">Watchlist</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                  <button onClick={() => handleRemove(game.rawgId)}>×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Library;
