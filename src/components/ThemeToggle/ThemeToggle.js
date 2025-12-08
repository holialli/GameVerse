import  { useState, useEffect } from 'react';
import styles from './ThemeToggle.module.css';

// Reads from Local Storage
// Default to 'dark' so the site starts in dark mode
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme ? savedTheme : 'dark';
};

const ThemeToggle = () => {
   
  const [theme, setTheme] = useState(getInitialTheme);

  // Use useEffect to update html attribute and Local Storage 
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Saves to Local Storage 
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={styles.themeToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;