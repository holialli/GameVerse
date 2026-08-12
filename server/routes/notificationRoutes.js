const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, notificationController.getNotifications);
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);
router.patch('/:id/read', authMiddleware, notificationController.markRead);
router.patch('/read-all', authMiddleware, notificationController.markAllRead);

module.exports = router;
