import React from 'react';
import SEO from '../../components/SEO/SEO';
import styles from './Support.module.css';

const KOFI_URL = process.env.REACT_APP_KOFI_URL || 'https://ko-fi.com/gameverse';

const Support = () => (
  <section className={styles.page}>
    <SEO
      title="Support GameVerse"
      description="Support the development of GameVerse."
      url="https://game-verse.tech/support"
    />
    <h1>Support GameVerse</h1>
    <p>
      GameVerse is a solo-built, ad-free project. If it's been useful to you, you can help keep it
      running with a donation on Ko-fi — no subscription required, any amount helps.
    </p>
    <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className={styles.kofiBtn}>
      Support on Ko-fi
    </a>
    <p className={styles.note}>
      Supporters automatically receive a "Supporter" badge on their profile once their donation is processed
      (use the same email as your GameVerse account so we can match it).
    </p>
  </section>
);

export default Support;
