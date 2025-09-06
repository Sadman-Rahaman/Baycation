// backend/routes/ratingRoutes.js
const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');
const auth = require('../middleware/auth');

// Create or update rating
router.post('/', auth, RatingController.createRating);

// Get ratings for a target
router.get('/:targetType/:targetId', RatingController.getRatings);

// Vote on rating helpfulness
router.post('/:ratingId/vote', auth, RatingController.voteHelpful);

// Report a rating
router.post('/:ratingId/report', auth, RatingController.reportRating);

// Get user's ratings
router.get('/user/ratings', auth, RatingController.getUserRatings);

module.exports = router;
