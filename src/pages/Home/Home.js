import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css'; 
import localData from '../../data/db.json';
import Card from '../../components/Card/card';
import AskAI from '../../components/AskAI/AskAI'; 

const Home = () => {
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    
    setHighlights(localData.homeHighlights);
  }, []);

  return (
    <>
      <section className={styles.hero}>
        <div className="hero-content">
          <p className="eyebrow">Welcome to GameVerse</p>
          <h1 className="headline">Explore worlds, master genres, and stay ahead of gaming culture</h1>
          <p className="subhead">Discover popular titles, learn about game genres, read the latest updates, and dive into our curated gallery — all in one grid-powered experience.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/genres">Explore Genres</Link>
            <Link className="button ghost" to="/news">Latest News</Link>
          </div>
          <AskAI />
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Featured Highlights</h2>
          <p className="section-desc">A quick taste of what GameVerse offers.</p>
        </div>
        <div className="grid-cards">
          {highlights.map((item) => (
            <Card
              key={item.id}
              title={item.title}
              meta={item.meta}
              image={item.image}
              link={item.link}
              linkLabel={item.linkLabel}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;