// backend/routes/tripRoutes.js
const express = require('express');
const TripController = require('../controllers/tripController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', TripController.getAllTrips);
// Place specific routes BEFORE parameterized ones to avoid capture
router.get('/feed', auth, TripController.getFollowedFeed);
router.get('/:tripId', TripController.getTrip);

// Protected routes
router.use(auth);

// Trip CRUD operations
router.post('/', TripController.createTrip);
router.put('/:tripId', TripController.updateTrip);
router.delete('/:tripId', TripController.deleteTrip);

// Admin approval
router.post('/:tripId/approve', TripController.approveTrip);
router.get('/admin/pending', TripController.getPendingTrips);

// Trip participation
router.post('/:tripId/join', TripController.joinTrip);
router.delete('/:tripId/leave', TripController.leaveTrip);

// User's trips
router.get('/user/my-trips', TripController.getUserTrips);

// Itinerary management
router.put('/:tripId/itinerary', TripController.updateItinerary);

module.exports = router;