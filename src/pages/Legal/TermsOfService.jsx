import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import styles from './Legal.module.css';

const TermsOfService = () => (
  <section className={styles.container}>
    <SEO
      title="Terms of Service"
      description="The terms that govern your use of GameVerse."
      url="https://game-verse.tech/terms"
    />
    <h1>Terms of Service</h1>
    <p className={styles.updated}>Last updated: July 2026</p>

    <p>
      By creating an account or using GameVerse, you agree to these terms. If you don't
      agree, please don't use the site.
    </p>

    <h2>What GameVerse is</h2>
    <p>
      GameVerse is a game discovery, tracking, and community platform. It helps you find
      games, check hardware compatibility, and track your own library and watchlist.
      GameVerse does not sell, distribute, or grant licenses to any games — any "buy" or
      "rent" style actions in the product are personal tracking features only and do not
      constitute a real purchase, rental, or transfer of rights to any game.
    </p>

    <h2>Your account</h2>
    <ul>
      <li>You must provide accurate registration information and keep your password secure.</li>
      <li>You're responsible for activity that happens under your account.</li>
      <li>You must be old enough to legally use online services in your jurisdiction; GameVerse is not directed at children under 13.</li>
    </ul>

    <h2>Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Post content in community chat, video submissions, or elsewhere that is illegal, harassing, hateful, or infringes someone else's rights.</li>
      <li>Attempt to bypass moderation, rate limits, or security controls.</li>
      <li>Upload files that aren't what they claim to be (e.g. disguising executable or script content as an image).</li>
      <li>Use automated tools to scrape or abuse the AI features, community chat, or API endpoints beyond normal personal use.</li>
    </ul>
    <p>
      Community chat is moderated (automated filtering plus review) and repeated violations
      may result in a shadowban or account suspension.
    </p>

    <h2>Content you submit</h2>
    <p>
      You retain ownership of content you submit (chat messages, video links, bios, avatars),
      but grant GameVerse a license to display it within the product. Submitted videos are
      reviewed before appearing publicly and may be rejected or removed at our discretion.
    </p>

    <h2>Third-party data &amp; game information</h2>
    <p>
      Game catalog data is sourced from RAWG and other public APIs and may be incomplete or
      inaccurate. AI-generated recommendations and answers (via Google Gemini) are provided
      for convenience and may occasionally be wrong — verify anything important independently.
    </p>

    <h2>No warranty</h2>
    <p>
      GameVerse is provided "as is," without warranties of any kind. We do not guarantee the
      site will be uninterrupted, error-free, or that any AI-generated content will be
      accurate.
    </p>

    <h2>Limitation of liability</h2>
    <p>
      To the fullest extent permitted by law, GameVerse and its operator are not liable for
      indirect, incidental, or consequential damages arising from your use of the site.
    </p>

    <h2>Changes</h2>
    <p>We may update these terms as the product evolves. Continued use after changes means you accept the updated terms.</p>

    <h2>Contact</h2>
    <p>Questions about these terms? Reach out via the <Link to="/contact">Contact page</Link>.</p>
  </section>
);

export default TermsOfService;
