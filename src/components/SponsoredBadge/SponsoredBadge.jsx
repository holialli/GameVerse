import React from 'react';
import styles from './SponsoredBadge.module.css';

// Reused wherever a paid catalog placement is rendered - always visible,
// never disguised as an organic result.
const SponsoredBadge = () => <span className={styles.badge}>Sponsored</span>;

export default SponsoredBadge;
