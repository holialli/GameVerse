const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../utils/multerConfig');

// Upload image
router.post('/', authMiddleware, upload.single('image'), uploadController.uploadImage);

module.exports = router;
