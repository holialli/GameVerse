/**
 * Generate VideoGame JSON-LD Schema for Google Rich Snippets
 * Helps Google display ratings, genres, release dates in search results
 *
 * @param {Object} game - Game object with properties: name, description, image, genres, releaseDate, rating
 * @returns {Object} JSON-LD structure formatted for Helmet
 */
export const generateVideoGameSchema = (game) => {
  if (!game) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    description: game.description || 'Game on GameVerse platform',
    image: game.background_image || game.image,
    url: `https://game-verse.tech/games/${game.slug || game.id}`,
    ...(game.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating,
        bestRating: '5',
        worstRating: '1',
        ratingCount: game.rating_count || Math.floor(game.rating * 100),
      },
    }),
    ...(game.genres && game.genres.length > 0 && {
      genre: game.genres.map((g) => (typeof g === 'string' ? g : g.name)),
    }),
    ...(game.released && {
      datePublished: game.released,
    }),
    author: {
      '@type': 'Organization',
      name: game.developer || 'Independent Developer',
    },
    ...(game.platforms && {
      gamePlatform: game.platforms.map((p) => (typeof p === 'string' ? p : p.name)),
    }),
    inLanguage: 'en-US',
  };
};

/**
 * Generate Organization Schema (for homepage)
 */
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GameVerse',
    url: 'https://game-verse.tech',
    logo: 'https://game-verse.tech/logo.png',
    description:
      'Explore worlds, master genres, and stay ahead of gaming culture. Discover popular titles, learn game genres, read latest updates.',
    sameAs: [
      'https://twitter.com/gameverse',
      'https://facebook.com/gameverse',
      'https://instagram.com/gameverse',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@game-verse.tech',
    },
  };
};

/**
 * Generate BreadcrumbList Schema (for navigation)
 * @param {Array} breadcrumbs - Array of {title, url} objects
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.title,
      item: crumb.url,
    })),
  };
};
