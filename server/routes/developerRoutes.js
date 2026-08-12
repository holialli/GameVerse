const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const developerController = require('../controllers/developerController');
const validateRequest = require('../middlewares/validateRequest');
const { developerSignupSchema } = require('../utils/validationSchemas');

// Light IP-based limit to deter signup spam (each signup sends an email).
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', signupLimiter, validateRequest(developerSignupSchema), developerController.signup);

module.exports = router;
