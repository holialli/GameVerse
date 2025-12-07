const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const upload = require('../utils/multerConfig');
const { createGameSchema, updateGameSchema } = require('../utils/validationSchemas');

// Public routes
router.get('/', gameController.getAllGames);
router.get('/:id', gameController.getGameById);

// Protected routes
router.post('/', authMiddleware, upload.single('image'), validateRequest(createGameSchema), gameController.createGame);
router.patch('/:id', authMiddleware, upload.single('image'), validateRequest(updateGameSchema), gameController.updateGame);
router.delete('/:id', authMiddleware, gameController.deleteGame);

// User's games
router.get('/user/my-games', authMiddleware, gameController.getUserGames);

module.exports = router;
