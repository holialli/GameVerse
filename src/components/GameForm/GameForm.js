import React, { useState, useEffect } from 'react';
import styles from './GameForm.module.css';
import { gameAPI } from '../../services/api';

const GameForm = ({ game = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    releaseDate: '',
    rating: 5,
    platform: [],
    developer: '',
    imageUrl: '',
    buyPrice: 9.99,
    rentPrice: 2.99
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (game) {
      setFormData({
        title: game.title || '',
        description: game.description || '',
        genre: game.genre || '',
        releaseDate: game.releaseDate ? game.releaseDate.split('T')[0] : '',
        rating: game.rating || 5,
        platform: Array.isArray(game.platform) ? game.platform : [],
        developer: game.developer || '',
        imageUrl: game.imageUrl || '',
        buyPrice: game.buyPrice || 9.99,
        rentPrice: game.rentPrice || 2.99
      });
    }
  }, [game]);

  const genres = [
    'Action',
    'Adventure',
    'RPG',
    'Strategy',
    'Simulation',
    'Puzzle',
    'Sports',
    'Horror',
    'Indie',
    'FPS'
  ];

  const platforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlatformChange = (platform) => {
    setFormData(prev => ({
      ...prev,
      platform: prev.platform.includes(platform)
        ? prev.platform.filter(p => p !== platform)
        : [...prev.platform, platform]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.genre) {
        throw new Error('Genre is required');
      }
      if (!formData.releaseDate) {
        throw new Error('Release date is required');
      }
      if (formData.platform.length === 0) {
        throw new Error('Select at least one platform');
      }
      if (formData.rating < 0 || formData.rating > 10) {
        throw new Error('Rating must be between 0 and 10');
      }
      if (formData.buyPrice < 0.99) {
        throw new Error('Buy price must be at least $0.99');
      }
      if (formData.rentPrice < 0.99) {
        throw new Error('Rent price must be at least $0.99');
      }

      // Only send the fields we need
      const cleanData = {
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        releaseDate: formData.releaseDate,
        rating: parseFloat(formData.rating),
        platform: formData.platform,
        developer: formData.developer,
        imageUrl: formData.imageUrl,
        buyPrice: parseFloat(formData.buyPrice),
        rentPrice: parseFloat(formData.rentPrice),
      };

      console.log('Submitting data:', cleanData);

      if (game?._id) {
        // Update existing game
        const response = await gameAPI.updateGame(game._id, cleanData);
        console.log('Update response:', response);
      } else {
        // Create new game
        const response = await gameAPI.createGame(cleanData);
        console.log('Create response:', response);
      }

      onSubmit();
    } catch (err) {
      console.error('Form error:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Error saving game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="title">Game Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter game title"
          maxLength="100"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Enter game description"
          rows="4"
          maxLength="500"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="genre">Genre *</label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
          >
            <option value="">Select genre</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="developer">Developer</label>
          <input
            type="text"
            id="developer"
            name="developer"
            value={formData.developer}
            onChange={handleInputChange}
            placeholder="Studio name"
            maxLength="100"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="releaseDate">Release Date *</label>
          <input
            type="date"
            id="releaseDate"
            name="releaseDate"
            value={formData.releaseDate}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="rating">Rating (0-10)</label>
          <input
            type="number"
            id="rating"
            name="rating"
            value={formData.rating}
            onChange={handleInputChange}
            min="0"
            max="10"
            step="0.5"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="buyPrice">Buy Price ($)</label>
          <input
            type="number"
            id="buyPrice"
            name="buyPrice"
            value={formData.buyPrice}
            onChange={handleInputChange}
            min="0.99"
            step="0.01"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="rentPrice">Rent Price ($)</label>
          <input
            type="number"
            id="rentPrice"
            name="rentPrice"
            value={formData.rentPrice}
            onChange={handleInputChange}
            min="0.99"
            step="0.01"
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Platforms *</label>
        <div className={styles.checkboxGroup}>
          {platforms.map(platform => (
            <label key={platform} className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.platform.includes(platform)}
                onChange={() => handlePlatformChange(platform)}
              />
              <span>{platform}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="imageUrl">Image URL</label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleInputChange}
          placeholder="https://..."
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Saving...' : game ? 'Update Game' : 'Add Game'}
        </button>
      </div>
    </form>
  );
};

export default GameForm;
