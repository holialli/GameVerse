const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middleware/requireAdmin');

// Middleware chain enforcement
router.use(authMiddleware);
router.use(requireAdmin);

// Video Queue
router.get('/videos/pending', adminController.getPendingVideos);
router.patch('/videos/:id/approve', adminController.approveVideo);
router.delete('/videos/:id', adminController.deleteVideo);

// AI Prompt Tuner (SiteConfig)
router.get('/config/:key', adminController.getSiteConfig);
router.patch('/config/:key', adminController.updateSiteConfig);

// Tournament Verifier
router.patch('/events/:eventId/winner', adminController.setEventWinner);

module.exports = router;
