import React from 'react';
import AffiliateDisclosure from '../AffiliateDisclosure/AffiliateDisclosure';
import styles from './StoreLinksCard.module.css';

const StoreLinksCard = ({ storeLinks }) => {
  if (!Array.isArray(storeLinks) || storeLinks.length === 0) return null;

  return (
    <div className={styles.card}>
      <h3>Where to Buy</h3>
      <div className={styles.linkRow}>
        {storeLinks.map((link) => (
          <a
            key={link.store}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={styles.storeLink}
          >
            {link.label}
          </a>
        ))}
      </div>
      <AffiliateDisclosure />
    </div>
  );
};

export default StoreLinksCard;
