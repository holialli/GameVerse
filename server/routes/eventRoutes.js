const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', eventController.getEvents);
router.post('/request', authMiddleware, eventController.createEventRequest);
router.post('/:eventId/join-request', authMiddleware, eventController.joinEventRequest);
router.post('/', authMiddleware, eventController.createEvent);
router.post('/:eventId/join', authMiddleware, eventController.joinEvent);

module.exports = router;
