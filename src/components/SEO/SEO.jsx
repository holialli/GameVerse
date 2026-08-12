import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Reusable SEO Component using react-helmet-async
 * Manages title, meta description, OG tags, Twitter cards, and canonical URLs
 *
 * Usage:
 * <SEO
 *   title="Game Title"
 *   description="Detailed game description"
 *   image="https://..."
 *   url="https://game-verse.tech/games/..."
 *   type="article" // 'article', 'game', 'website'
 * />
 */
const SEO = ({
  title = 'GameVerse',
  description = 'Explore worlds, master genres, and stay ahead of gaming culture',
  image = 'https://game-verse.tech/og-image.png',
  url = 'https://game-verse.tech',
  type = 'website',
  author = 'GameVerse',
  publishedDate = null,
  jsonLd = null,
}) => {
  const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'GameVerse';
  const safeDescription = typeof description === 'string' && description.trim()
    ? description.trim()
    : 'Explore worlds, master genres, and stay ahead of gaming culture';

  // Enforce length limits for best practices
  const truncatedTitle = safeTitle.length > 60 ? safeTitle.substring(0, 57) + '...' : safeTitle;
  const truncatedDesc = safeDescription.length > 155 ? safeDescription.substring(0, 152) + '...' : safeDescription;
  const finalTitle = /gameverse/i.test(truncatedTitle) ? truncatedTitle : `${truncatedTitle} | GameVerse`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={truncatedDesc} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

      {/* Open Graph (Facebook, Discord, LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={truncatedTitle} />
      <meta property="og:description" content={truncatedDesc} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={truncatedTitle} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="GameVerse" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={truncatedTitle} />
      <meta name="twitter:description" content={truncatedDesc} />
      <meta name="twitter:image" content={image} />

      {/* Article-specific tags */}
      {type === 'article' && publishedDate && (
        <meta property="article:published_time" content={publishedDate} />
      )}

      {/* Canonical URL to prevent duplicate content */}
      <link rel="canonical" href={url} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
