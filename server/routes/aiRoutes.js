const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const User = require('../models/User');
const aiController = require('../controllers/aiController');

// Populates req.isPremiumUser synchronously (a DB lookup, not a JWT claim)
// so a lapsed subscription stops bypassing the limiter immediately rather
// than waiting for token refresh - express-rate-limit's `skip` must be
// synchronous, so this has to run and finish before the limiters do.
const attachSubscriptionStatus = async (req, res, next) => {
  req.isPremiumUser = false;
  if (req.user?.id) {
    try {
      const user = await User.findById(req.user.id).select('subscriptionTier').lean();
      req.isPremiumUser = user?.subscriptionTier === 'premium';
    } catch (err) {
      // Fail open to non-premium (still rate-limited), not fail closed to blocking the request.
    }
  }
  next();
};

const rateLimitHandler = (req, res) => {
  res.status(429).json({ status: 'error', message: 'Too many AI requests. Please try again later.' });
};

// Free-tier limiter - unchanged default, just now skippable for premium users.
const freeTierLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.isPremiumUser === true,
  handler: rateLimitHandler,
});

// "Unlimited" for premium still means a high cost/abuse ceiling, not a
// literal unbounded quota against a paid Gemini API.
const premiumTierLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.isPremiumUser !== true,
  handler: rateLimitHandler,
});

router.use(optionalAuthMiddleware);
router.use(attachSubscriptionStatus);
router.use(freeTierLimiter);
router.use(premiumTierLimiter);

// Public routes (available to all users, including non-authenticated)
router.post('/discover', aiController.streamDiscovery);
router.post('/chat', aiController.chatSimple);

module.exports = router;
