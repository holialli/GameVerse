const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/promote', adminController.promoteToAdmin);
router.patch('/users/:id/demote', adminController.demoteToUser);
router.delete('/users/:id', adminController.deleteUser);

// Statistics
router.get('/statistics', adminController.getStatistics);

module.exports = router;
