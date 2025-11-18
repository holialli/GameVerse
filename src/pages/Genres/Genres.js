import React, { useState, useEffect } from 'react';
import localData from '../../data/db.json';
import Card from '../../components/Card/card';

const Genres = () => {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    setGenres(localData.genres);
  }, []);

  return (
    <section className="section">
      <div className="section-header">
        <h1 className="section-title">Game Genres</h1>
        <p className="section-desc">From immersive role-playing to high-octane shooters—find your style.</p>
      </div>

      <div className="grid-cards">
        {genres.map((genre) => (
          <Card
            key={genre.id}
            title={genre.title}
            meta={genre.meta}
            image={genre.image}
          />
        ))}
      </div>
    </section>
  );
};

export default Genres;