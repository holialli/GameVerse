const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/status', authMiddleware, subscriptionController.getSubscriptionStatus);
router.post('/checkout', authMiddleware, subscriptionController.createSubscriptionCheckout);

module.exports = router;
