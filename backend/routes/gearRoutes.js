// backend/routes/gearRoutes.js
const express = require('express');
const router = express.Router();
const GearController = require('../controllers/gearController');
const auth = require('../middleware/auth');

// Create gear listing
router.post('/', auth, GearController.createGear);

// Get all gear with filters
router.get('/', GearController.getAllGear);

// Get gear categories - MUST be before /:gearId
router.get('/categories/list', GearController.getCategories);

// Get user's gear listings - MUST be before /:gearId
router.get('/user/listings', auth, GearController.getUserGear);

// Get single gear item - PUT THIS AFTER SPECIFIC ROUTES
router.get('/:gearId', GearController.getGear);

// Update gear listing
router.put('/:gearId', auth, GearController.updateGear);

// Delete gear listing
router.delete('/:gearId', auth, GearController.deleteGear);

// Add to wishlist
router.post('/:gearId/wishlist', auth, GearController.addToWishlist);

module.exports = router;
