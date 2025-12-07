const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get user profile
router.get('/:id', userController.getUserProfile);

// Protected routes
router.patch('/:id/profile', authMiddleware, userController.updateProfile);
router.patch('/:id/change-password', authMiddleware, userController.changePassword);
router.get('/:id/dashboard', authMiddleware, userController.getDashboard);

module.exports = router;
