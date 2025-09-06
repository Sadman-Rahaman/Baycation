// backend/routes/storyRoutes.js
const express = require('express');
const router = express.Router();
const StoryController = require('../controllers/storyController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Story CRUD operations
router.post('/', StoryController.createStory);
router.get('/feed', StoryController.getStoriesFeed);
router.get('/following', StoryController.getFollowingFeed);
router.get('/user/:userId', StoryController.getUserStories);
router.get('/:storyId', StoryController.getStory);
router.put('/:storyId', StoryController.updateStory);
router.delete('/:storyId', StoryController.deleteStory);
router.post('/:storyId/archive', StoryController.archiveStory);

// Story engagement
router.post('/:storyId/like', StoryController.toggleLike);
router.post('/:storyId/comments', StoryController.addComment);
router.put('/:storyId/comments/:commentId', StoryController.updateComment);
router.delete('/:storyId/comments/:commentId', StoryController.deleteComment);

module.exports = router;
