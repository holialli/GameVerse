const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// User: Buy a game (protected route)
router.post('/buy', authMiddleware, purchaseController.buyGame);

// User: Rent a game (protected route)
router.post('/rent', authMiddleware, purchaseController.rentGame);

// User: Get their purchased/rented games
router.get('/my-games', authMiddleware, purchaseController.getUserGames);

// User: Return a rented game early
router.patch('/:purchaseId/return', authMiddleware, purchaseController.returnRental);

// Admin: View all purchases (analytics)
router.get('/analytics/all', authMiddleware, adminMiddleware, purchaseController.getAllPurchases);

module.exports = router;
