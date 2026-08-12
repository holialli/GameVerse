import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import SEO from '../../components/SEO/SEO';
import styles from './HardwareTier.module.css';

const TIER_ORDER = ['budget', 'mid-range', 'high-end'];

const HardwareTier = () => {
  const { tier } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/games/tier/${encodeURIComponent(tier)}`);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.status === 404 ? 'Unknown hardware tier.' : 'Failed to load recommendations.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tier]);

  useEffect(() => {
    if (tier) fetchTier();
  }, [tier, fetchTier]);

  if (loading) return <div className={styles.status}>Loading...</div>;

  if (error) {
    return (
      <div className={styles.status}>
        <p className={styles.errorText}>{error}</p>
        <button type="button" className={styles.retryButton} onClick={fetchTier}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const otherTiers = TIER_ORDER.filter((t) => t !== tier);

  return (
    <section className={styles.page}>
      <SEO
        title={`Best Games for a ${data.label} | GameVerse`}
        description={data.description}
        url={`https://game-verse.tech/best-games/${tier}`}
      />
      <header className={styles.header}>
        <h1>Best Games for a {data.label}</h1>
        <p>{data.description}</p>
        <p className={styles.specBlurb}>{data.specBlurb}</p>
        <Link to="/compatibility" className={styles.checkerLink}>Check your exact hardware in the Compatibility Lab &rarr;</Link>
      </header>

      {data.games.length === 0 ? (
        <div className={styles.empty}>Live catalog is temporarily unavailable - check back soon.</div>
      ) : (
        <div className={styles.grid}>
          {data.games.map((game) => (
            <Link key={game.rawgId} to={`/games/${game.rawgSlug || game.rawgId}`} className={styles.card}>
              {game.coverUrl ? (
                <img src={game.coverUrl} alt={game.title} className={styles.cover} loading="lazy" />
              ) : (
                <div className={styles.noCover}>No Cover</div>
              )}
              <div className={styles.cardInfo}>
                <h3>{game.title}</h3>
                <p>{game.genre}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className={styles.tierNav}>
        <p>Different hardware tier?</p>
        <div className={styles.tierNavRow}>
          {otherTiers.map((t) => (
            <Link key={t} to={`/best-games/${t}`}>{t.replace('-', ' ')}</Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HardwareTier;
