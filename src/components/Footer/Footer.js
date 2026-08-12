import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Footer = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <small>© {year} GameVerse</small>
        <div className="footer-links">
          <Link to="/games">Games</Link>
          <Link to="/news">News</Link>
          <Link to="/compatibility">Compatibility</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          <Link to="/support">Support Us</Link>
          <Link to="/developers">API</Link>
          {!isAuthenticated && <Link to="/login">Login</Link>}
          {!isAuthenticated && <Link to="/register">Register</Link>}
          {isAuthenticated && !isAdmin && <Link to="/contact">Contact</Link>}
          {isAuthenticated && !isAdmin && <Link to="/discovery">Discovery</Link>}
          {isAuthenticated && !isAdmin && <Link to="/events">Events</Link>}
          {isAuthenticated && isAdmin && <Link to="/admin">Admin Center</Link>}
          {isAuthenticated && isAdmin && <Link to="/profile">Admin Profile</Link>}
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;