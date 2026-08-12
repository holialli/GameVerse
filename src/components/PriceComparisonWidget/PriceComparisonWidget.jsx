import React, { useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios';
import AffiliateDisclosure from '../AffiliateDisclosure/AffiliateDisclosure';
import styles from './PriceComparisonWidget.module.css';

// Independent fetch/loading state on purpose - a slow or down price API
// should never block the rest of the page it's embedded in.
const PriceComparisonWidget = ({ title }) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!title) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/games/prices', { params: { title } });
        if (!cancelled) setDeals(Array.isArray(res.data?.deals) ? res.data.deals : []);
      } catch (err) {
        if (!cancelled) setDeals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [title]);

  if (loading) return null;
  if (deals.length === 0) return null;

  return (
    <div className={styles.card}>
      <h3>Current Prices</h3>
      <ul className={styles.list}>
        {deals.map((deal, idx) => (
          <li key={`${deal.store}-${idx}`} className={styles.row}>
            <span className={styles.store}>{deal.store}</span>
            <span className={styles.price}>
              ${deal.price.toFixed(2)}
              {deal.retailPrice > deal.price && (
                <span className={styles.retail}>${deal.retailPrice.toFixed(2)}</span>
              )}
            </span>
            <a href={deal.dealUrl} target="_blank" rel="noopener noreferrer sponsored" className={styles.buyBtn}>
              View Deal
            </a>
          </li>
        ))}
      </ul>
      <AffiliateDisclosure />
    </div>
  );
};

export default PriceComparisonWidget;
