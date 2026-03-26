const express = require('express');
const router = express.Router();
const hardwareController = require('../controllers/hardwareController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/index', authMiddleware, hardwareController.getHardwareList);
router.get('/compatibility/:rawgId', authMiddleware, hardwareController.checkCompatibility);
router.patch('/profile', authMiddleware, hardwareController.saveHardwareProfile);

module.exports = router;
