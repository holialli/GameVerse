import React from 'react';
import styles from './Gallery.module.css';

const Gallery = () => {
  return (
    <section className="section">
      <div className="section-header">
        <h1 className="section-title">Game Gallery</h1>
        <p className="section-desc">Iconic moments and trailers.</p>
      </div>

      <div className={styles.videoWrapper}>
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/SSo_EIwHSd4" // Example: Cyberpunk 2077 trailer
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
};

export default Gallery;