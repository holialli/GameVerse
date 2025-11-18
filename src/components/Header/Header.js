import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import styles from './Header.module.css'; // Import as CSS Module
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const Header = () => {
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
          </ul>
        </nav>
        <div className={styles.controls}>
          <ThemeToggle /> 
          <div className="cta"><Link className="button" to="/popular">Browse Games</Link></div>
        </div>
      </div>
    </header>
  );
};

export default Header;