import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/SEO/SEO';
import { generateVideoGameSchema } from '../../components/JSONLDSchemas/VideoGameSchema';
import StoreLinksCard from '../../components/StoreLinksCard/StoreLinksCard';
import styles from './CompatibilityGame.module.css';

const stripHtml = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const CompatibilityGame = () => {
  const { rawgSlug } = useParams();
  const { isAuthenticated } = useAuth();
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchGame = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/games/slug/${encodeURIComponent(rawgSlug)}`);
      setGame(res.data);
    } catch (err) {
      setError(err?.response?.status === 404 ? 'Game not found.' : 'Failed to load game details.');
      setGame(null);
    } finally {
      setLoading(false);
    }
  }, [rawgSlug]);

  useEffect(() => {
    if (rawgSlug) fetchGame();
  }, [rawgSlug, fetchGame]);

  const addAndCheck = async () => {
    if (!isAuthenticated || !game) return;
    setAdding(true);
    try {
      await axiosInstance.post('/users/games', {
        rawgId: game.rawgId,
        rawgSlug: game.rawgSlug,
        title: game.title,
        coverUrl: game.coverUrl,
        status: 'library',
      });
      toast.success(`${game.title} added to your library.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add game to library');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className={styles.status}>Loading...</div>;

  if (error) {
    return (
      <div className={styles.status}>
        <p className={styles.errorText}>{error}</p>
        <button type="button" className={styles.retryButton} onClick={fetchGame}>Retry</button>
      </div>
    );
  }

  if (!game) return null;

  const description = stripHtml(game.description);
  const pageUrl = `https://game-verse.tech/compatibility/${game.rawgSlug || game.rawgId}`;
  const title = `Can I Run ${game.title}? PC Requirements & Compatibility | GameVerse`;
  const seoDescription = game.pcRequirements
    ? `Minimum and recommended PC system requirements for ${game.title}, plus a personalized compatibility check.`
    : `Check whether your PC can run ${game.title} with GameVerse's hardware compatibility tools.`;

  return (
    <div className={styles.page}>
      <SEO
        title={title}
        description={seoDescription}
        image={game.coverUrl || '/placeholder.png'}
        url={pageUrl}
        type="article"
        jsonLd={generateVideoGameSchema({
          name: game.title,
          description,
          background_image: game.coverUrl,
          slug: game.rawgSlug,
          id: game.rawgId,
          rating: game.rating,
          genres: game.genre ? [game.genre] : [],
          released: game.released,
          platforms: game.platforms,
        })}
      />

      <div className={styles.header}>
        <img src={game.coverUrl || '/placeholder.png'} alt={game.title} className={styles.cover} loading="lazy" />
        <div>
          <h1>Will my PC run {game.title}?</h1>
          <p className={styles.subhead}>{description.slice(0, 220)}</p>
          <div className={styles.linkRow}>
            <Link to={`/games/${game.rawgSlug || game.rawgId}`}>View game details</Link>
          </div>
        </div>
      </div>

      {game.pcRequirements ? (
        <div className={styles.requirementsGrid}>
          {game.pcRequirements.minimum && (
            <article className={styles.reqCard}>
              <h2>Minimum Requirements</h2>
              <p dangerouslySetInnerHTML={{ __html: game.pcRequirements.minimum }} />
            </article>
          )}
          {game.pcRequirements.recommended && (
            <article className={styles.reqCard}>
              <h2>Recommended Requirements</h2>
              <p dangerouslySetInnerHTML={{ __html: game.pcRequirements.recommended }} />
            </article>
          )}
        </div>
      ) : (
        <div className={styles.noReqs}>
          <p>Exact published requirements aren't available for this title yet. Use our generic hardware catalog to estimate performance instead.</p>
        </div>
      )}

      <StoreLinksCard storeLinks={game.storeLinks} />

      <div className={styles.cta}>
        <h2>Get a personalized compatibility score</h2>
        <p>Add {game.title} to your library, then run it through the Compatibility Lab against your exact CPU, GPU, and RAM.</p>
        {isAuthenticated ? (
          <button type="button" onClick={addAndCheck} disabled={adding} className={styles.ctaBtn}>
            {adding ? 'Adding...' : `Add to Library & Check Compatibility`}
          </button>
        ) : (
          <Link to="/login" className={styles.ctaBtn}>Sign in to check compatibility</Link>
        )}
        <Link to="/compatibility" className={styles.ctaSecondary}>Open Compatibility Lab</Link>
      </div>

      <div className={styles.tierLinks}>
        <p>Not sure what tier your PC is in? Browse curated picks:</p>
        <div className={styles.tierLinkRow}>
          <Link to="/best-games/budget">Budget PC</Link>
          <Link to="/best-games/mid-range">Mid-Range PC</Link>
          <Link to="/best-games/high-end">High-End PC</Link>
        </div>
      </div>
    </div>
  );
};

export default CompatibilityGame;
