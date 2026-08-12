import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css'; 
import Card from '../../components/Card/card';
import CommunityChat from '../../components/CommunityChat/CommunityChat';
import AskAIWidget from '../../components/AskAIWidget/AskAIWidget';
import { optimizeUnsplashUrl } from '../../utils/imageOptimization';
import SEO from '../../components/SEO/SEO';
import { generateOrganizationSchema } from '../../components/JSONLDSchemas/VideoGameSchema';

const differentiators = [
  {
    id: 'd-1',
    title: 'Ask AI, Instantly',
    body: 'A real Gemini-backed quick-ask widget right on this page - no sign-in required. Ask for a recommendation and get one back in seconds.',
    link: '/discovery',
    linkLabel: 'Open Discovery Oracle',
  },
  {
    id: 'd-2',
    title: 'Will My PC Run It?',
    body: 'Check published minimum/recommended requirements for any game, then run your exact CPU/GPU/RAM against it in the Compatibility Lab.',
    link: '/compatibility',
    linkLabel: 'Check Compatibility',
  },
  {
    id: 'd-3',
    title: 'Best Games By Hardware Tier',
    body: "Not sure what your PC can handle? Browse curated picks for budget, mid-range, and high-end builds.",
    link: '/best-games/mid-range',
    linkLabel: 'Browse Mid-Range Picks',
  },
];

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
          <AskAIWidget />
        </div>
      </section>
      <CommunityChat />

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Why GameVerse</h2>
          <p className="section-desc">The tools that make this more than another game-tracking site.</p>
        </div>
        <div className={styles.differentiatorGrid}>
          {differentiators.map((item) => (
            <article key={item.id} className={styles.differentiatorCard}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <Link to={item.link}>{item.linkLabel} &rarr;</Link>
            </article>
          ))}
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