import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import styles from './Header.module.css'; // Import as CSS Module
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    // Use the .site-header class from global base.css
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/">
          <span className="brand-logo" aria-hidden="true"></span>
          <span className="brand-name">GameVerse</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary">
          <ul className="nav-list">
            {/* Use NavLink for active styling */}
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/genres">Genres</NavLink></li>
            <li><NavLink to="/popular">Popular</NavLink></li>
            <li><NavLink to="/news">News</NavLink></li>
            <li><NavLink to="/events">Events</NavLink></li>
            <li><NavLink to="/gallery">Gallery</NavLink></li>
            <li><NavLink to="/contact">Contact</NavLink></li>
            {isAuthenticated ? (
              <>
                <li><NavLink to="/dashboard">Dashboard</NavLink></li>
                <li><NavLink to="/profile">Profile</NavLink></li>
              </>
            ) : null}
          </ul>
        </nav>
        <div className={styles.controls}>
          <ThemeToggle /> 
          <div className="cta"><Link className="button" to="/popular">Browse Games</Link></div>
          {isAuthenticated ? (
            <div className={styles.authBlock}>
              <span className={styles.welcome}>Hi, {user?.name || 'Player'}</span>
              <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
            </div>
          ) : (
            <div className={styles.authBlock}>
              <Link to="/login" className={styles.link}>Login</Link>
              <Link to="/register" className={styles.link}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;