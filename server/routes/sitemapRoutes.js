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

/**
 * Generate sitemap.xml with dynamic game routes
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://game-verse.tech';

    // Static pages
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/news', priority: 0.8, changefreq: 'daily' },
      { path: '/games', priority: 0.9, changefreq: 'daily' },
      { path: '/gallery', priority: 0.7, changefreq: 'weekly' },
      { path: '/events', priority: 0.6, changefreq: 'weekly' },
      { path: '/compatibility', priority: 0.5, changefreq: 'monthly' },
      { path: '/discovery', priority: 0.6, changefreq: 'daily' },
    ];

    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    staticPages.forEach((page) => {
      sitemapXml += `  <url>\n`;
      sitemapXml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      sitemapXml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      sitemapXml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemapXml += `    <priority>${page.priority}</priority>\n`;
      sitemapXml += `  </url>\n`;
    });

    // Example: Add dynamic game routes (requires Game model)
    // Uncomment and update if you have a database of games
    /*
    const Game = require('../models/Game');
    const games = await Game.find().select('slug updatedAt').limit(50000);
    
    games.forEach((game) => {
      sitemapXml += `  <url>\n`;
      sitemapXml += `    <loc>${baseUrl}/games/${game.slug}</loc>\n`;
      sitemapXml += `    <lastmod>${game.updatedAt.toISOString()}</lastmod>\n`;
      sitemapXml += `    <changefreq>weekly</changefreq>\n`;
      sitemapXml += `    <priority>0.8</priority>\n`;
      sitemapXml += `  </url>\n`;
    });
    */

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
