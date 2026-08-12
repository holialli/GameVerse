/**
 * Sitemap Generator for GameVerse
 * Generates dynamic sitemap.xml with game detail routes and static pages
 *
 * Usage:
 * 1. Add route to server.js:
 *    const generateSitemap = require('./routes/sitemapRoutes');
 *    app.use('/', generateSitemap);
 *
 * 2. Visit: https://game-verse.tech/sitemap.xml
 */

const express = require('express');
const router = express.Router();
const UserGame = require('../models/UserGame');

const escapeXml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const urlEntry = (baseUrl, { path, priority, changefreq, lastmod }) => (
  `  <url>\n` +
  `    <loc>${baseUrl}${escapeXml(path)}</loc>\n` +
  `    <lastmod>${(lastmod instanceof Date ? lastmod : new Date()).toISOString()}</lastmod>\n` +
  `    <changefreq>${changefreq}</changefreq>\n` +
  `    <priority>${priority}</priority>\n` +
  `  </url>\n`
);

/**
 * Generate sitemap.xml with dynamic game routes
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://game-verse.tech';
    const now = new Date();

    // Static pages
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/news', priority: 0.8, changefreq: 'daily' },
      { path: '/games', priority: 0.9, changefreq: 'daily' },
      { path: '/gallery', priority: 0.7, changefreq: 'weekly' },
      { path: '/events', priority: 0.6, changefreq: 'weekly' },
      { path: '/compatibility', priority: 0.5, changefreq: 'monthly' },
      { path: '/discovery', priority: 0.6, changefreq: 'daily' },
      { path: '/leaderboard', priority: 0.5, changefreq: 'daily' },
      { path: '/best-games/budget', priority: 0.6, changefreq: 'weekly' },
      { path: '/best-games/mid-range', priority: 0.6, changefreq: 'weekly' },
      { path: '/best-games/high-end', priority: 0.6, changefreq: 'weekly' },
      { path: '/privacy', priority: 0.2, changefreq: 'yearly' },
      { path: '/terms', priority: 0.2, changefreq: 'yearly' },
    ];

    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    staticPages.forEach((page) => {
      sitemapXml += urlEntry(baseUrl, { ...page, lastmod: now });
    });

    // Per-game URLs are sourced from real user activity (UserGame), not the
    // unused local Game catalog (which has no slug and no public route - see
    // git history for why that approach was abandoned). Every distinct
    // rawgSlug a real user has tracked resolves against two live public
    // routes: the RAWG-backed detail page and the compatibility page.
    const trackedGames = await UserGame.aggregate([
      { $match: { rawgSlug: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$rawgSlug', lastmod: { $max: '$addedAt' } } },
      { $sort: { lastmod: -1 } },
      { $limit: 5000 },
    ]);

    trackedGames.forEach(({ _id: slug, lastmod }) => {
      sitemapXml += urlEntry(baseUrl, {
        path: `/games/${slug}`,
        priority: 0.7,
        changefreq: 'weekly',
        lastmod,
      });
      sitemapXml += urlEntry(baseUrl, {
        path: `/compatibility/${slug}`,
        priority: 0.6,
        changefreq: 'weekly',
        lastmod,
      });
    });

    sitemapXml += `</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=604800'); // 1 week
    res.send(sitemapXml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

module.exports = router;
