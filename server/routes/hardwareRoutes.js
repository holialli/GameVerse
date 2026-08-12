const express = require('express');
const router = express.Router();
const hardwareController = require('../controllers/hardwareController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');

router.get('/index', hardwareController.getHardwareList);
router.get('/compatibility/:rawgId', optionalAuthMiddleware, hardwareController.checkCompatibility);

router.get('/profiles', authMiddleware, hardwareController.listHardwareProfiles);
router.post('/profiles', authMiddleware, hardwareController.createHardwareProfile);
router.patch('/profiles/:profileId', authMiddleware, hardwareController.updateHardwareProfile);
router.delete('/profiles/:profileId', authMiddleware, hardwareController.deleteHardwareProfile);

module.exports = router;
