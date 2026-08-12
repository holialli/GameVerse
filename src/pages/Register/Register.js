import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Register.module.css';

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  // Password validation requirements
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasDigit: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(req => req);
  const isPasswordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = String(name || '').trim();
    const trimmedUsername = String(username || '').trim();
    const trimmedEmail = String(email || '').trim();

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError('Username must be 3-30 characters and use only letters, numbers, _ or -.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must include 8+ characters, at least 1 number, and at least 1 symbol.');
      return;
    }

    if (!isPasswordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register(trimmedName, trimmedUsername, trimmedEmail, password, confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1>Register for GameVerse</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Choose a username (letters, numbers, _, -)"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
            {password && (
                          <div className={styles.passwordRequirements}>
                            <p className={styles.requirementsTitle}>Password Requirements:</p>
                            <div className={`${styles.requirement} ${passwordRequirements.minLength ? styles.met : ''}`}>
                              <span className={styles.icon}>{passwordRequirements.minLength ? '✓' : '✗'}</span>
                              At least 8 characters
                            </div>
                            <div className={`${styles.requirement} ${passwordRequirements.hasDigit ? styles.met : ''}`}>
                              <span className={styles.icon}>{passwordRequirements.hasDigit ? '✓' : '✗'}</span>
                              At least 1 number (0-9)
                            </div>
                            <div className={`${styles.requirement} ${passwordRequirements.hasSymbol ? styles.met : ''}`}>
                              <span className={styles.icon}>{passwordRequirements.hasSymbol ? '✓' : '✗'}</span>
                              At least 1 symbol (!@#$%^&*)
                            </div>
                          </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
            {confirmPassword && (
                          <p className={`${styles.passwordMatch} ${isPasswordsMatch ? styles.match : styles.mismatch}`}>
                            {isPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                          </p>
            )}
          </div>

          <p className={styles.terms}>
            By registering, you agree to our <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>

          <button type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className={styles.redirect}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
