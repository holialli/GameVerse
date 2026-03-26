import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './GameDetail.module.css';

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

  return (
    <div className={styles.page}>
      <h1>{game.name}</h1>
      <img src={game.background_image || '/placeholder.png'} alt={game.name} className={styles.cover} />
      <div dangerouslySetInnerHTML={{ __html: game.description || 'No description available.' }} />
      <h3>Similar Games</h3>
      {similar.slice(0, 4).map(s => <div key={s.id}>{s.name}</div>)}
    </div>
  );
};
export default GameDetail;
