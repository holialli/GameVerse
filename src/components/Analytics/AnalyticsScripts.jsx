import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || '';
const CLOUDFLARE_ANALYTICS_TOKEN = process.env.REACT_APP_CLOUDFLARE_ANALYTICS_TOKEN || '';

const loadScript = (src, attributes = {}) => {
  if (document.querySelector(`script[src="${src}"]`)) {
    return null;
  }

  const script = document.createElement('script');
  script.src = src;
  script.async = true;

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      script.setAttribute(key, String(value));
    }
  });

  document.head.appendChild(script);
  return script;
};

const AnalyticsScripts = () => {
  const location = useLocation();

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
      };

      loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname + window.location.search,
      });
    }

    if (CLOUDFLARE_ANALYTICS_TOKEN) {
      loadScript('https://static.cloudflareinsights.com/beacon.min.js', {
        'data-cf-beacon': JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN }),
      });
    }
  }, []);

  useEffect(() => {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
};

export default AnalyticsScripts;