import React, { useState, useEffect } from 'react';
import styles from './News.module.css'; // CSS Module

const News = () => {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const NEWSAPI_KEY = process.env.REACT_APP_NEWSAPI_KEY;
        if (!NEWSAPI_KEY) {
          setError('No NewsAPI key configured. Add REACT_APP_NEWSAPI_KEY to your .env');
          setIsLoading(false);
          return;
        }

          // Strongly prefer established gaming domains to avoid unrelated news
          const q = encodeURIComponent('esports OR gaming OR "video games" OR "e-sports"');
          const DOMAINS = 'ign.com,pcgamer.com,polygon.com,gamesradar.com,gamespot.com,rockpapershotgun.com,comicbook.com,screencrush.com,mobilesyrup.com,dotesports.com,esportsinsider.com,verge.com,variety.com';
        const url = `https://newsapi.org/v2/everything?q=${q}&domains=${DOMAINS}&language=en&sortBy=publishedAt&pageSize=8&apiKey=${NEWSAPI_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`NewsAPI error: ${res.status} ${res.statusText}`);
        const json = await res.json();
        if (!Array.isArray(json.articles)) throw new Error('Unexpected NewsAPI response');

        const mapped = json.articles.map((a, idx) => ({
          id: a.url || `${a.publishedAt}-${idx}`,
          title: a.title,
          tags: a.source && a.source.name ? [a.source.name] : [],
          reactions: 0,
          body: a.description || a.content || a.title,
          url: a.url,
          source: a.source && a.source.name ? a.source.name : 'NewsAPI'
        }));

        setArticles(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []); // Empty array means this runs once on mount

  // Handle loading state 
  if (isLoading) {
    return (
      <section className="section">
        <div className="section-header">
          <h1 className="section-title">News & Updates</h1>
          <p className="section-desc">Loading fresh stories...</p>
        </div>
      </section>
    );
  }

  // Handle error state 
  if (error) {
    return (
      <section className="section">
        <div className="section-header">
          <h1 className="section-title">News & Updates</h1>
          <p className={`${styles.errorText} section-desc`}>
            Error: {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-header">
        <h1 className="section-title">News & Updates</h1>
        <p className="section-desc">Fresh stories from the world of gaming.</p>
      </div>

      

      <div className={styles.newsGrid}>
        {articles.map((article) => {
          const tags = Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '—');

          const formatReactions = (r) => {
            if (r == null) return 0;
            if (typeof r === 'number') return r;
            if (typeof r === 'object') {
              // common shape: { likes: n, dislikes: n }
              if ('likes' in r || 'dislikes' in r) {
                const likes = Number(r.likes || 0);
                const dislikes = Number(r.dislikes || 0);
                return likes + dislikes;
              }
              // fallback: sum numeric values
              return Object.values(r).reduce((acc, v) => acc + (typeof v === 'number' ? v : Number(v) || 0), 0);
            }
            return String(r);
          };

          return (
            <article key={article.id} className={styles.newsItem}>
              <h2 className="card-title">{article.title}</h2>
              <p className="card-meta">Tags: {tags} • {formatReactions(article.reactions)} Reactions</p>
              <p>{(article.body || '').substring(0, 150)}...</p>
              <div style={{ marginTop: 10 }}>
                {article.url ? (
                  <a href={article.url} target="_blank" rel="noopener noreferrer">Source: {article.source || 'External'}</a>
                ) : (
                  <small>Source: {article.source || 'Unknown'}</small>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default News;