const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { reviewSchema } = require('../utils/validationSchemas');

router.get('/game/:rawgId', reviewController.getReviewsForGame);
router.post('/game/:rawgId', authMiddleware, validateRequest(reviewSchema), reviewController.upsertReview);
router.delete('/:id', authMiddleware, reviewController.deleteOwnReview);

module.exports = router;
