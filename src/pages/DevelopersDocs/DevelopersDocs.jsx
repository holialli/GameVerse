import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import styles from './DevelopersDocs.module.css';

const CURL_EXAMPLE = `curl -X POST https://game-verse.tech/api/v1/compatibility/check \\
  -H "Authorization: Bearer $GAMEVERSE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "rawgId": 3498,
    "cpu": "Intel Core i5-10400F",
    "gpu": "NVIDIA RTX 3060",
    "ramGb": 16,
    "platform": "pc"
  }'`;

const JS_EXAMPLE = `const res = await fetch('https://game-verse.tech/api/v1/compatibility/check', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rawgId: 3498,
    cpu: 'Intel Core i5-10400F',
    gpu: 'NVIDIA RTX 3060',
    ramGb: 16,
    platform: 'pc',
  }),
});
const data = await res.json();`;

const RESPONSE_EXAMPLE = `{
  "matched": {
    "cpu": { "name": "Intel Core i5-10400F", "confidence": 0.83 },
    "gpu": { "name": "NVIDIA RTX 3060", "confidence": 1 }
  },
  "status": "Green",
  "tier": "Great Fit",
  "bottleneck": "CPU",
  "estimatedFps": { "low": 82, "medium": 68, "high": 53 },
  "gameSpecific": {
    "available": true,
    "meetsMinimum": true,
    "meetsRecommended": true,
    "matchConfidence": "high"
  }
}`;

const DevelopersDocs = () => (
  <section className={styles.page}>
    <SEO
      title="Compatibility API Docs"
      description="API reference for the GameVerse hardware compatibility engine."
      url="https://game-verse.tech/developers/docs"
    />
    <h1>Compatibility API Docs</h1>
    <p>
      Don't have a key yet? <Link to="/developers">Get one here</Link> - free tier included.
    </p>

    <h2>Endpoint</h2>
    <p><code>POST /api/v1/compatibility/check</code></p>

    <h2>Authentication</h2>
    <p>Pass your key as <code>Authorization: Bearer YOUR_API_KEY</code> or an <code>X-API-Key</code> header.</p>

    <h2>Request Body</h2>
    <table className={styles.table}>
      <thead>
        <tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr>
      </thead>
      <tbody>
        <tr><td>rawgId</td><td>number</td><td>No</td><td>RAWG game id - enables game-specific fit scoring, if we have parsed requirements for it</td></tr>
        <tr><td>cpu</td><td>string</td><td>Yes</td><td>Free-text CPU name, fuzzy-matched against our hardware catalog</td></tr>
        <tr><td>gpu</td><td>string</td><td>Yes</td><td>Free-text GPU name, fuzzy-matched against our hardware catalog</td></tr>
        <tr><td>ramGb</td><td>number</td><td>No</td><td>Defaults to 16</td></tr>
        <tr><td>platform</td><td>string</td><td>No</td><td>pc | steamdeck | ps5 | xboxseriesx | nintendoswitch</td></tr>
      </tbody>
    </table>

    <h2>Example Request</h2>
    <pre className={styles.code}>{CURL_EXAMPLE}</pre>
    <pre className={styles.code}>{JS_EXAMPLE}</pre>

    <h2>Example Response</h2>
    <pre className={styles.code}>{RESPONSE_EXAMPLE}</pre>

    <h2>Rate Limits</h2>
    <table className={styles.table}>
      <thead><tr><th>Plan</th><th>Monthly Requests</th></tr></thead>
      <tbody>
        <tr><td>Free</td><td>1,000</td></tr>
        <tr><td>Paid</td><td>Higher - contact us to upgrade</td></tr>
      </tbody>
    </table>

    <h2>Errors</h2>
    <ul>
      <li><code>401</code> - missing/invalid/inactive API key</li>
      <li><code>400</code> - couldn't confidently match the given CPU/GPU name</li>
      <li><code>429</code> - monthly quota exceeded</li>
    </ul>
  </section>
);

export default DevelopersDocs;
