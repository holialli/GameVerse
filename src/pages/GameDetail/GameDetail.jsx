import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './GameDetail.module.css';
import SEO from '../../components/SEO/SEO';
import { generateVideoGameSchema } from '../../components/JSONLDSchemas/VideoGameSchema';

const GameDetail = () => {
  const { rawgSlug } = useParams();
  const [game, setGame] = useState(null);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const base = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5000/api';
        const [detailRes, simRes] = await Promise.all([
          fetch(`${base}/games/${rawgSlug}`).then(r => r.json()),
          fetch(`${base}/games/${rawgSlug}/similar`).then(r => r.json())
        ]);
        setGame(detailRes);
        setSimilar(simRes.results || []);
      } catch (err) {}
    };
    if (rawgSlug) fetchGame();
  }, [rawgSlug]);

  if (!game) return <div>Loading...</div>;

  const plainDescription = String(game.description || 'No description available.')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Generate canonical URL
  const gameUrl = `https://game-verse.tech/games/${game.slug || game.id}`;
  const gameTitle = `${game.name} - Reviews, Rating & Details | GameVerse`;
  const gameDescription = plainDescription.substring(0, 155);

  return (
    <div className={styles.page}>
      <SEO
        title={gameTitle}
        description={gameDescription}
        image={game.background_image || '/placeholder.png'}
        url={gameUrl}
        type="article"
        publishedDate={game.released}
        jsonLd={generateVideoGameSchema(game)}
      />
      <h1>{game.name}</h1>
      <img
        src={game.background_image || '/placeholder.png'}
        alt={game.name}
        className={styles.cover}
        loading="lazy"
        width="1200"
        height="600"
        style={{ aspectRatio: '2/1', objectFit: 'cover' }}
      />
      <p>{plainDescription}</p>
      <h3>Similar Games</h3>
      {similar.slice(0, 4).map(s => <div key={s.id}>{s.name}</div>)}
    </div>
  );
};
export default GameDetail;
