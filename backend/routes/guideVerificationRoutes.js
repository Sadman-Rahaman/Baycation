// backend/routes/guideVerificationRoutes.js
const express = require('express');
const router = express.Router();
const GuideVerificationController = require('../controllers/guideVerificationController');
const auth = require('../middleware/auth');

// Submit verification request
router.post('/', auth, GuideVerificationController.submitVerification);

// Get verification status
router.get('/status', auth, GuideVerificationController.getVerificationStatus);

// Update verification request
router.put('/:verificationId', auth, GuideVerificationController.updateVerification);

// Admin: Get all verification requests
router.get('/admin/all', auth, GuideVerificationController.getAllVerifications);

// Admin: Review verification request
router.put('/admin/:verificationId/review', auth, GuideVerificationController.reviewVerification);

// Get verification statistics
router.get('/admin/stats', auth, GuideVerificationController.getVerificationStats);

module.exports = router;
