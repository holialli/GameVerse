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
            {isAuthenticated && <li><NavLink to="/dashboard">Dashboard</NavLink></li>}
            <li><NavLink to="/">Home</NavLink></li>
            {isAuthenticated && <li><NavLink to="/games">Games</NavLink></li>}
            <li><NavLink to="/genres">Genres</NavLink></li>
            <li><NavLink to="/popular">Popular</NavLink></li>
            <li><NavLink to="/news">News</NavLink></li>
            <li><NavLink to="/events">Events</NavLink></li>
            <li><NavLink to="/gallery">Gallery</NavLink></li>
            {user?.role !== 'admin' && <li><NavLink to="/contact">Contact</NavLink></li>}
            {isAuthenticated && <li><NavLink to="/profile">Profile</NavLink></li>}
          </ul>
        </nav>
        <div className={styles.controls}>
          {isAuthenticated ? (
            <div className={styles.authBlock}>
              {user?.avatar && (
                <Link to="/profile" className={styles.avatarLink}>
                  <img src={user.avatar} alt="Profile" className={styles.headerAvatar} />
                </Link>
              )}
              <button className={styles.logoutBtn} onClick={logout}>Sign Out</button>
            </div>
          ) : (
            <div className={styles.authBlock}>
              <Link to="/login" className={styles.authBtn}>Login</Link>
              <Link to="/register" className={styles.authBtnPrimary}>Register</Link>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;