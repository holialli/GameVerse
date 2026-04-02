import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css'; 
import Card from '../../components/Card/card';
import AskAI from '../../components/AskAI/AskAI'; 
import { optimizeUnsplashUrl } from '../../utils/imageOptimization';
import SEO from '../../components/SEO/SEO';
import { generateOrganizationSchema } from '../../components/JSONLDSchemas/VideoGameSchema';

const defaultHighlights = [
  {
    id: 'h-1',
    title: 'Track Top Releases',
    meta: 'Discover trending and newly launched games.',
    image: optimizeUnsplashUrl('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80'),
    link: '/games',
    linkLabel: 'Browse Games',
  },
  {
    id: 'h-2',
    title: 'Build Your Profile',
    meta: 'Save preferences and personalize recommendations.',
    image: optimizeUnsplashUrl('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'),
    link: '/profile',
    linkLabel: 'View Profile',
  },
  {
    id: 'h-3',
    title: 'Stay Updated',
    meta: 'Read fresh esports and gaming industry news.',
    image: optimizeUnsplashUrl('https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1200&q=80'),
    link: '/news',
    linkLabel: 'Open News',
  },
];

const Home = () => {
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    setHighlights(defaultHighlights);
  }, []);

  return (
    <>
      <SEO
        title="GameVerse Home"
        description="Explore GameVerse games, gaming news, and compatibility tools from a single public homepage."
        url="https://game-verse.tech/"
        jsonLd={generateOrganizationSchema()}
      />
      <section className={styles.hero}>
        <img
          src="/images/fighting.webp"
          alt=""
          aria-hidden="true"
          className={styles.heroImage}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className={`hero-content ${styles.heroContent}`}>
          <p className="eyebrow">Welcome to GameVerse</p>
          <h1 className="headline">Explore worlds, master genres, and stay ahead of gaming culture</h1>
          <p className="subhead">Discover popular titles, learn about game genres, read the latest updates, and dive into our curated gallery — all in one grid-powered experience.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/games">Explore Games</Link>
            <Link className="button ghost" to="/news">Latest News</Link>
            <Link className="button ghost" to="/compatibility">Check Compatibility</Link>
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