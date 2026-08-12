const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/adminMiddleware');

router.get('/', eventController.getEvents);
router.post('/request', authMiddleware, eventController.createEventRequest);
router.post('/:eventId/join-request', authMiddleware, eventController.joinEventRequest);
// Direct event creation/join bypass the approval workflow (createEventRequest /
// joinEventRequest above) - restricted to admins so regular users can't
// self-publish or self-join without going through approval.
router.post('/', authMiddleware, requireAdmin, eventController.createEvent);
router.post('/:eventId/join', authMiddleware, requireAdmin, eventController.joinEvent);

module.exports = router;
