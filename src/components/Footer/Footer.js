import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <small>© {year} GameVerse</small>
        <div className="footer-links">
          <Link to="/contact">Contact</Link>
          <Link to="/news">News</Link>
          <Link to="/popular">Popular</Link>
          <Link to="/events">Events</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;