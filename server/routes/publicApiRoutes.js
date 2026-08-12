const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const publicApiController = require('../controllers/publicApiController');
const apiKeyAuth = require('../middlewares/apiKeyAuth');
const validateRequest = require('../middlewares/validateRequest');
const { publicCompatibilitySchema } = require('../utils/validationSchemas');

// DoS backstop, independent of the per-key monthly quota apiKeyAuth enforces.
const dosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/check', dosLimiter, apiKeyAuth, validateRequest(publicCompatibilitySchema), publicApiController.checkCompatibility);

module.exports = router;
