// backend/routes/userRoutes.js
const express = require('express');
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/all', UserController.listAllUsersPublic);

// Protected routes
router.get('/profile', auth, UserController.getProfile);
router.put('/profile', auth, UserController.updateProfile);
router.post('/logout', auth, UserController.logout);
router.delete('/account', auth, UserController.deleteAccount);
// Put user listing before parameterized /admin/:userId routes
router.get('/admin', auth, UserController.listUsers);

// Admin management routes
router.post('/admin/:userId/promote', auth, UserController.promoteUser);
router.post('/admin/:userId/demote', auth, UserController.demoteUser);
router.delete('/admin/:userId', auth, UserController.adminDeleteUser);

module.exports = router;
