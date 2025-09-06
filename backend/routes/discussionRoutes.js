// backend/routes/discussionRoutes.js
const express = require('express');
const DiscussionController = require('../controllers/discussionController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get trip discussion
router.get('/trip/:tripId', DiscussionController.getDiscussion);

// Send message
router.post('/trip/:tripId/messages', DiscussionController.sendMessage);

// Update typing status
router.post('/trip/:tripId/typing', DiscussionController.updateTypingStatus);

// Mark user as active
router.post('/trip/:tripId/active', DiscussionController.markUserActive);

module.exports = router;