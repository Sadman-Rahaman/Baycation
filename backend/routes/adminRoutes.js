// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Get dashboard overview statistics
router.get('/dashboard/stats', auth, AdminController.getDashboardStats);

// Get content management data
router.get('/content', auth, AdminController.getContentManagement);

// Approve or reject content
router.put('/content/:type/:id', auth, AdminController.manageContent);

// Get reports and analytics
router.get('/reports', auth, AdminController.getReports);

// Get system health metrics
router.get('/system/health', auth, AdminController.getSystemHealth);

// Get flagged content
router.get('/flagged', auth, AdminController.getFlaggedContent);

// Moderate flagged content
router.put('/moderate/:type/:id', auth, AdminController.moderateContent);

module.exports = router;
