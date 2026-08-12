import React from 'react';
import styles from './AffiliateDisclosure.module.css';

// Reused wherever affiliate links appear - keeps the FTC-style disclosure
// consistent instead of repeating copy in every component.
const AffiliateDisclosure = () => (
  <p className={styles.disclosure}>
    Affiliate links — GameVerse may earn a commission on purchases made through these links, at no extra cost to you.
  </p>
);

export default AffiliateDisclosure;
