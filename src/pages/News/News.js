import React, { useState, useEffect } from 'react';
import styles from './News.module.css'; // CSS Module
import axiosInstance from '../../lib/axios';
import SEO from '../../components/SEO/SEO';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [refreshedAt, setRefreshedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const safeExternalUrl = (value) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      return parsed.toString();
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axiosInstance.get('/news/trending');
        const mapped = Array.isArray(res?.data?.articles) ? res.data.articles : [];

        setArticles(mapped);
        setRefreshedAt(res?.data?.refreshedAt || '');
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load gaming news');
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

  const scored = articles
    .sort((a, b) => Number(b.hotScore || 0) - Number(a.hotScore || 0))
    .slice(0, 8);

  return (
    <section className="section">
      <SEO
        title="Gaming News"
        description="Read the latest gaming publications and community trends on GameVerse."
        url="https://game-verse.tech/news"
      />
      <div className="section-header">
        <h1 className="section-title">News & Updates</h1>
        <p className="section-desc">
          Daily top stories from gaming publications plus major community trends.
          {refreshedAt ? ` Refreshed: ${new Date(refreshedAt).toLocaleDateString()}.` : ''}
        </p>
      </div>

      <div className={styles.newsGrid}>
        {scored.length === 0 && (
          <article className={styles.newsItem}>
            <h2 className="card-title">No matching stories</h2>
            <p className="card-meta">No stories available right now. Please try again in a few minutes.</p>
          </article>
        )}

        {scored.map((article) => {
          const tags = Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '—');
          const externalUrl = safeExternalUrl(article.url);

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
              <p className="card-meta">Tags: {tags}</p>
              <div className={styles.metricsRow}>
                <span className={styles.metricPill}>Hot Score {article.hotScore || 0}</span>
                <span className={styles.metricPill}>{article.comments || 0} comments</span>
                <span className={styles.metricPill}>{formatReactions(article.reactions)} reactions</span>
              </div>
              <p className={styles.bodyText}>{(article.body || '').substring(0, 170)}...</p>
              <div className={styles.sourceRow}>
                {externalUrl ? (
                  <>
                    <a href={externalUrl} target="_blank" rel="noopener noreferrer">Source: {article.source || 'External'}</a>
                    <a href={externalUrl} target="_blank" rel="noopener noreferrer" className={styles.readMore}>Read More</a>
                  </>
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