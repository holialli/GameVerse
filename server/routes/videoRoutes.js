const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limit: 5 submissions per 24 hours per user
const submitLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, 
  max: 5,
  message: 'Daily video submission limit (5) reached.',
  keyGenerator: (req) => req.user?.id || req.ip // Rate limit by user logically
});

router.route('/')
  .get(videoController.getVideos)
  .post(authMiddleware, submitLimiter, videoController.submitVideo);

module.exports = router;
