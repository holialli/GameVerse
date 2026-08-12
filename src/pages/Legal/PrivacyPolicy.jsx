import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import styles from './Legal.module.css';

const PrivacyPolicy = () => (
  <section className={styles.container}>
    <SEO
      title="Privacy Policy"
      description="How GameVerse collects, uses, and protects your data."
      url="https://game-verse.tech/privacy"
    />
    <h1>Privacy Policy</h1>
    <p className={styles.updated}>Last updated: July 2026</p>

    <p>
      GameVerse ("we", "us") is a game discovery, tracking, and community platform. This
      page explains what data we collect when you use the site, why we collect it, and
      what choices you have.
    </p>

    <h2>Information we collect</h2>
    <ul>
      <li><strong>Account data</strong> — name, username, email address, and password (stored as a salted hash, never in plain text) when you register.</li>
      <li><strong>Profile data</strong> — optional bio, avatar image, and any games you add to your library, watchlist, or completion history.</li>
      <li><strong>Content you submit</strong> — community chat messages, video/clip submissions, and contact form messages.</li>
      <li><strong>Usage data</strong> — pages visited and general interaction data via Google Analytics and Cloudflare Web Analytics, if enabled in your browser.</li>
      <li><strong>Technical data</strong> — IP address and request metadata, used only for rate limiting, abuse prevention, and moderation (e.g. shadowban enforcement in community chat).</li>
    </ul>

    <h2>How we use your information</h2>
    <ul>
      <li>To create and secure your account (authentication uses short-lived access tokens plus a rotating refresh token stored in an HTTP-only cookie).</li>
      <li>To power features you use directly: your library/watchlist, the hardware compatibility checker, AI-assisted game discovery, and community chat.</li>
      <li>To moderate community chat and video submissions for abuse and policy violations.</li>
      <li>To send account-related email (welcome, purchase confirmations, badge notifications, event approvals) — these are best-effort and never block core functionality if delivery fails.</li>
      <li>To understand aggregate site usage and improve the product.</li>
    </ul>

    <h2>Third-party services</h2>
    <p>Some features rely on third-party providers, each of which processes only the data needed for that feature:</p>
    <ul>
      <li><strong>RAWG</strong> — game catalog data (titles, covers, ratings) shown throughout the site.</li>
      <li><strong>Google Gemini</strong> — powers AI game recommendations and the AI chat widget. Your questions are sent to Gemini to generate a response; we do not send your account credentials.</li>
      <li><strong>Reddit &amp; public RSS feeds</strong> — aggregated to build the News page.</li>
      <li><strong>Google Analytics / Cloudflare Web Analytics</strong> — anonymized-where-possible traffic analytics.</li>
    </ul>
    <p>We do not sell your personal data to anyone.</p>

    <h2>Cookies &amp; local storage</h2>
    <p>
      We use HTTP-only cookies to store your authentication tokens securely, and your
      browser's local storage to keep you signed in across page reloads. Disabling cookies
      will prevent you from staying logged in.
    </p>

    <h2>Data retention &amp; deletion</h2>
    <p>
      We retain account data for as long as your account is active. To request access to,
      correction of, or deletion of your data (including full account deletion), contact us
      via the <Link to="/contact">Contact page</Link>. We'll respond and complete verified
      deletion requests within a reasonable timeframe.
    </p>

    <h2>Children's privacy</h2>
    <p>GameVerse is not directed at children under 13, and we do not knowingly collect data from them.</p>

    <h2>Changes to this policy</h2>
    <p>We may update this policy as the product evolves. Material changes will be reflected by updating the date at the top of this page.</p>

    <h2>Contact</h2>
    <p>Questions about this policy or your data? Reach out via the <Link to="/contact">Contact page</Link>.</p>
  </section>
);

export default PrivacyPolicy;
