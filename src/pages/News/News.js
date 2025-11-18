import React, { useState, useEffect } from 'react';
import styles from './News.module.css'; // CSS Module

const News = () => {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Fetch from a free public API 
        const response = await fetch('https://dummyjson.com/posts?limit=6');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        setArticles(data.posts);
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
          <p className="section-desc" style={{ color: 'var(--danger)' }}>
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
        {articles.map((article) => (
          <article key={article.id} className={styles.newsItem}>
            <h2 className="card-title">{article.title}</h2>
            <p className="card-meta">
              Tags: {article.tags.join(', ')} • {article.reactions} Reactions
            </p>
            <p>{article.body.substring(0, 150)}...</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default News;