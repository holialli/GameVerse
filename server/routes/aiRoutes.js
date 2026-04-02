const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const aiController = require('../controllers/aiController');

// Public routes (available to all users, including non-authenticated)
router.post('/discover', aiController.streamDiscovery);
router.post('/chat', aiController.chatSimple);

module.exports = router;
