import React, { useState, useEffect } from 'react';
import localData from '../../data/db.json';
import Card from '../../components/Card/card';

const Popular = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    setGames(localData.popularGames);
  }, []);

  return (
    <section className="section">
      <div className="section-header">
        <h1 className="section-title">Popular Games</h1>
        <p className="section-desc">A curated set of legends that shaped the industry.</p>
      </div>

      <div className="grid-cards">
        {games.map((game) => (
          <Card
            key={game.id}
            title={game.title}
            meta={game.meta}
            image={game.image}
          />
        ))}
      </div>
    </section>
  );
};

export default Popular;