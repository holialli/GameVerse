const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.get('/trending', newsController.getTrendingNews);

module.exports = router;
