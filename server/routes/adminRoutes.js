const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/adminMiddleware');

// Middleware chain enforcement
router.use(authMiddleware);
router.use(requireAdmin);

// Admin overview and user moderation
router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/moderate', adminController.moderateUser);
router.patch('/users/:id/xp', adminController.grantUserXp);
router.patch('/users/:id/role', adminController.updateUserRole);
router.post('/users/:id/badges', adminController.grantUserBadge);

// Complaints and feedback review
router.get('/feedback', adminController.getPendingFeedback);
router.patch('/feedback/:id/resolve', adminController.resolveFeedback);
router.get('/audit-logs', adminController.getAuditLogs);

// Video Queue
router.get('/videos/pending', adminController.getPendingVideos);
router.get('/videos/approved', adminController.getApprovedVideos);
router.patch('/videos/:id/approve', adminController.approveVideo);
router.delete('/videos/:id', adminController.deleteVideo);

// AI Prompt Tuner (SiteConfig)
router.get('/config/:key', adminController.getSiteConfig);
router.patch('/config/:key', adminController.updateSiteConfig);

// Tournament Verifier
router.patch('/events/:eventId/winner', adminController.setEventWinner);
router.get('/events/requests', adminController.getPendingEventRequests);
router.get('/events/join-requests/pending-events', adminController.getEventsWithPendingJoinRequests);
router.patch('/events/:eventId/approve-request', adminController.approveEventRequest);
router.patch('/events/:eventId/reject-request', adminController.rejectEventRequest);
router.get('/events/:eventId/join-requests', adminController.getPendingJoinRequests);
router.patch('/events/:eventId/join-requests/:userId/approve', adminController.approveJoinRequest);
router.patch('/events/:eventId/join-requests/:userId/reject', adminController.rejectJoinRequest);

module.exports = router;
