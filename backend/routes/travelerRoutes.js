// backend/routes/travelerRoutes.js
const express = require('express');
const TravelerController = require('../controllers/travelerController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all travelers for finding travel buddies
router.get('/', TravelerController.getAllTravelers);

// Get specific traveler profile
router.get('/:travelerId', TravelerController.getTravelerProfile);

// Follow/unfollow travelers
router.post('/:travelerId/follow', TravelerController.followTraveler);
router.delete('/:travelerId/follow', TravelerController.unfollowTraveler);

// Get user's travel buddies
router.get('/me/travel-buddies', TravelerController.getTravelBuddies);

module.exports = router;
