import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../lib/axios';
import SEO from '../../components/SEO/SEO';
import styles from './DevelopersSignup.module.css';

const DevelopersSignup = () => {
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [issuedKey, setIssuedKey] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/developers/signup', { name, contactEmail });
      setIssuedKey(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create API key.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(issuedKey.apiKey);
    toast.success('Copied to clipboard.');
  };

  return (
    <section className={styles.page}>
      <SEO
        title="Developer API Signup"
        description="Get a free API key for the GameVerse hardware compatibility engine."
        url="https://game-verse.tech/developers"
      />
      <h1>GameVerse Compatibility API</h1>
      <p>Check whether a given CPU/GPU combination can run a specific game - free tier included, no credit card required.</p>

      {issuedKey ? (
        <div className={styles.keyBox}>
          <p className={styles.warning}>Store this now - it will not be shown again.</p>
          <code className={styles.key}>{issuedKey.apiKey}</code>
          <button type="button" onClick={copyKey} className={styles.copyBtn}>Copy to Clipboard</button>
          <p>Monthly limit: {issuedKey.monthlyLimit} requests.</p>
          <Link to="/developers/docs" className={styles.docsLink}>Read the API docs &rarr;</Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <label>
            Name / App
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </label>
          <label>
            Contact Email
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
          </label>
          <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Get API Key'}</button>
        </form>
      )}
    </section>
  );
};

export default DevelopersSignup;
