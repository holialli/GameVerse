import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './GameDetail.module.css';
import SEO from '../../components/SEO/SEO';
import { generateVideoGameSchema } from '../../components/JSONLDSchemas/VideoGameSchema';
import axiosInstance from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import StoreLinksCard from '../../components/StoreLinksCard/StoreLinksCard';
import PriceComparisonWidget from '../../components/PriceComparisonWidget/PriceComparisonWidget';

const API_BASE = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5000/api';

const GameDetail = () => {
  const { rawgSlug } = useParams();
  const { isAuthenticated } = useAuth();
  const [game, setGame] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchGame = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [detailRes, simRes] = await Promise.all([
        fetch(`${API_BASE}/games/slug/${encodeURIComponent(rawgSlug)}`),
        fetch(`${API_BASE}/games/slug/${encodeURIComponent(rawgSlug)}/similar`),
      ]);

      if (!detailRes.ok) {
        throw new Error(detailRes.status === 404 ? 'Game not found.' : 'Failed to load game details.');
      }

      const detailData = await detailRes.json();
      const simData = await simRes.json().catch(() => ({ results: [] }));

      setGame(detailData);
      setSimilar(Array.isArray(simData.results) ? simData.results : []);
    } catch (err) {
      setError(err.message || 'Failed to load game details.');
      setGame(null);
    } finally {
      setLoading(false);
    }
  }, [rawgSlug]);

  useEffect(() => {
    if (rawgSlug) fetchGame();
  }, [rawgSlug, fetchGame]);

  const fetchReviews = useCallback(async (rawgId) => {
    setReviewsLoading(true);
    try {
      const res = await axiosInstance.get(`/reviews/game/${rawgId}`);
      setReviews(Array.isArray(res.data.reviews) ? res.data.reviews : []);
      setAvgRating(res.data.avgRating);
    } catch (err) {
      // Non-blocking: reviews are supplementary to the page.
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (game?.rawgId) fetchReviews(game.rawgId);
  }, [game?.rawgId, fetchReviews]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!myRating) {
      toast.error('Pick a star rating first.');
      return;
    }
    setSubmittingReview(true);
    try {
      await axiosInstance.post(`/reviews/game/${game.rawgId}`, {
        rating: myRating,
        text: myText,
        rawgSlug: game.rawgSlug,
        gameTitle: game.title,
      });
      toast.success('Review saved.');
      setMyText('');
      fetchReviews(game.rawgId);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className={styles.status}>Loading...</div>;

  if (error) {
    return (
      <div className={styles.status}>
        <p className={styles.errorText}>{error}</p>
        <button type="button" className={styles.retryButton} onClick={fetchGame}>
          Retry
        </button>
      </div>
    );
  }

  if (!game) return null;

  const plainDescription = String(game.description || 'No description available.')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const gameUrl = `https://game-verse.tech/games/${game.rawgSlug || game.rawgId}`;
  const gameTitle = `${game.title} - Reviews, Rating & Details | GameVerse`;
  const gameDescription = plainDescription.substring(0, 155);

  const schemaGame = {
    name: game.title,
    description: plainDescription,
    background_image: game.coverUrl,
    slug: game.rawgSlug,
    id: game.rawgId,
    rating: game.rating,
    genres: game.genre ? [game.genre] : [],
    released: game.released,
    developer: game.owner,
    platforms: game.platforms,
  };

  return (
    <div className={styles.page}>
      <SEO
        title={gameTitle}
        description={gameDescription}
        image={game.coverUrl || '/placeholder.png'}
        url={gameUrl}
        type="article"
        publishedDate={game.released}
        jsonLd={generateVideoGameSchema(schemaGame)}
      />
      <h1>{game.title}</h1>
      <img
        src={game.coverUrl || '/placeholder.png'}
        alt={game.title}
        className={styles.cover}
        loading="lazy"
        width="1200"
        height="600"
        style={{ aspectRatio: '2/1', objectFit: 'cover' }}
      />
      <p>{plainDescription}</p>

      <StoreLinksCard storeLinks={game.storeLinks} />
      <PriceComparisonWidget title={game.title} />

      <p>
        <Link to={`/compatibility/${game.rawgSlug || game.rawgId}`} className={styles.compatLink}>
          Check PC Compatibility for {game.title} &rarr;
        </Link>
      </p>

      <section className={styles.reviews}>
        <h3>Player Reviews {avgRating != null && `(${avgRating}★ avg, ${reviews.length})`}</h3>

        {isAuthenticated ? (
          <form className={styles.reviewForm} onSubmit={submitReview}>
            <div className={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n <= myRating ? styles.starActive : styles.star}
                  onClick={() => setMyRating(n)}
                  aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={myText}
              onChange={(e) => setMyText(e.target.value)}
              placeholder="Share your thoughts on this game (optional)"
              maxLength={1000}
              rows={3}
            />
            <button type="submit" disabled={submittingReview} className={styles.reviewSubmit}>
              {submittingReview ? 'Saving...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <p className={styles.reviewSignIn}><Link to="/login">Sign in</Link> to leave a review.</p>
        )}

        {reviewsLoading ? (
          <p className={styles.reviewsLoading}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className={styles.noReviews}>No reviews yet. Be the first to share your thoughts.</p>
        ) : (
          <ul className={styles.reviewList}>
            {reviews.map((r) => (
              <li key={r._id} className={styles.reviewItem}>
                <div className={styles.reviewHead}>
                  <strong>{r.username}</strong>
                  <span className={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.text && <p>{r.text}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {similar.length > 0 && (
        <>
          <h3>Similar Games</h3>
          <div className={styles.similarGrid}>
            {similar.slice(0, 4).map((s) => (
              <Link key={s.rawgId} to={`/games/${s.rawgSlug || s.rawgId}`} className={styles.similarCard}>
                {s.title}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
export default GameDetail;
