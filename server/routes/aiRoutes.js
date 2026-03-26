const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/discover', aiController.streamDiscovery);
router.post('/chat', aiController.chatSimple);

module.exports = router;
