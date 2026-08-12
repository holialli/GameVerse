const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/stats/dashboard', authMiddleware, userController.getDashboardStats);

router.get('/games/library', authMiddleware, userController.getUserGames);
router.post('/games', authMiddleware, userController.addOrUpdateUserGame);
router.delete('/games/:rawgId', authMiddleware, userController.removeUserGame);
router.post('/games/:rawgId/session', authMiddleware, userController.logPlaySession);

router.get('/leaderboard/preview', userController.getLeaderboardPreview);
router.get('/leaderboard/full', userController.getFullLeaderboard);
router.get('/public/:username', userController.getPublicProfile);
router.get('/newsletter/unsubscribe', userController.unsubscribeNewsletter);

router.get('/:id', authMiddleware, userController.getUserProfile);
router.patch('/:id/profile', authMiddleware, userController.updateProfile);
router.patch('/:id/change-password', authMiddleware, userController.changePassword);

module.exports = router;
