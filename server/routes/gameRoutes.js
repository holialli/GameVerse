const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const upload = require('../utils/multerConfig');
const { createGameSchema, updateGameSchema } = require('../utils/validationSchemas');

// Public routes
router.get('/search', gameController.searchInternetGames);
router.get('/', gameController.getAllGames);
router.get('/slug/:rawgSlug/similar', gameController.getSimilarGames);
router.get('/slug/:rawgSlug', gameController.getGameBySlug);
router.get('/tier/:tier', gameController.getGamesByTier);
router.get('/prices', gameController.getPricesForGame);
router.get('/sponsored', gameController.getSponsoredGames);
router.get('/:id', gameController.getGameById);
router.post('/hydrate', gameController.hydrateGames);

// Protected routes
router.post('/', authMiddleware, upload.single('image'), upload.verifyUploadedImage, validateRequest(createGameSchema), gameController.createGame);
router.patch('/:id', authMiddleware, upload.single('image'), upload.verifyUploadedImage, validateRequest(updateGameSchema), gameController.updateGame);
router.delete('/:id', authMiddleware, gameController.deleteGame);

// User's games
router.get('/user/my-games', authMiddleware, gameController.getUserGames);

module.exports = router;
