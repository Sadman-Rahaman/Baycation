// backend/controllers/userController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

class UserController {
  // Admin: list users (admin or super admin)
  static async listUsers(req, res) {
    try {
      const acting = await User.findById(req.user.userId).select('role email');
      if (!acting) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const users = await User.find({})
        .select('name email role isOnline lastSeen location createdAt')
        .sort({ createdAt: -1 })
        .limit(500);

      res.json({ success: true, data: { users } });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ success: false, message: 'Server error while listing users' });
    }
  }

  // Public (dev/demo): list all users without auth
  static async listAllUsersPublic(req, res) {
    try {
      const users = await User.find({})
        .select('name email role isOnline lastSeen location createdAt')
        .sort({ createdAt: -1 })
        .limit(1000);
      res.json({ success: true, data: { users } });
    } catch (error) {
      console.error('Public list users error:', error);
      res.status(500).json({ success: false, message: 'Server error while listing users' });
    }
  }
  // Register new user
  static async register(req, res) {
    try {
      const { name, email, password, preferences, role, bio, location } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already exists with this email' 
        });
      }

      // Create new user
      const user = new User({
        id: uuidv4(),
        name,
        email,
        password,
        preferences: preferences || '',
        role: role || 'traveler',
        bio: bio || '',
        location: location || ''
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Server error during registration' 
      });
    }
  }

  // Utility: determine if the acting user is the super admin
  static async isSuperAdmin(userId) {
    try {
      const user = await User.findById(userId).select('email role');
      if (!user) return false;
      const superEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@gmail.com';
      const superId = process.env.SUPER_ADMIN_ID;
      return (
        (superEmail && user.email === superEmail) ||
        (superId && userId && userId.toString() === superId.toString())
      );
    } catch (e) {
      return false;
    }
  }

  // Admin: promote a user to admin (admin or super admin can do this)
  static async promoteUser(req, res) {
    try {
      const actingUser = await User.findById(req.user.userId).select('role email');
      const isSuper = await UserController.isSuperAdmin(req.user.userId);
      if (!actingUser || (actingUser.role !== 'admin' && !isSuper)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { userId } = req.params;
      const target = await User.findById(userId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      target.role = 'admin';
      await target.save();
      res.json({ success: true, message: 'User promoted to admin', data: { user: target } });
    } catch (error) {
      console.error('Promote user error:', error);
      res.status(500).json({ success: false, message: 'Server error while promoting user' });
    }
  }

  // Admin: demote an admin back to traveler (only super admin)
  static async demoteUser(req, res) {
    try {
      const isSuper = await UserController.isSuperAdmin(req.user.userId);
      if (!isSuper) {
        return res.status(403).json({ success: false, message: 'Super admin access required' });
      }

      const { userId } = req.params;
      const target = await User.findById(userId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Prevent demotion of super admin
      const targetIsSuper = (process.env.SUPER_ADMIN_EMAIL && target.email === process.env.SUPER_ADMIN_EMAIL) ||
                            (process.env.SUPER_ADMIN_ID && target._id.toString() === process.env.SUPER_ADMIN_ID.toString());
      if (targetIsSuper) {
        return res.status(400).json({ success: false, message: 'Cannot demote super admin' });
      }

      target.role = 'traveler';
      await target.save();
      res.json({ success: true, message: 'User demoted to traveler', data: { user: target } });
    } catch (error) {
      console.error('Demote user error:', error);
      res.status(500).json({ success: false, message: 'Server error while demoting user' });
    }
  }

  // Admin: delete a user (only super admin; cannot delete super admin)
  static async adminDeleteUser(req, res) {
    try {
      const acting = await User.findById(req.user.userId).select('role email');
      const isSuper = await UserController.isSuperAdmin(req.user.userId);
      if (!acting || (acting.role !== 'admin' && !isSuper)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { userId } = req.params;
      const target = await User.findById(userId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const targetIsSuper = (process.env.SUPER_ADMIN_EMAIL && target.email === process.env.SUPER_ADMIN_EMAIL) ||
                            (process.env.SUPER_ADMIN_ID && target._id.toString() === process.env.SUPER_ADMIN_ID.toString());
      if (targetIsSuper) {
        return res.status(400).json({ success: false, message: 'Cannot remove super admin' });
      }

      // Regular admins cannot remove other admins
      if (!isSuper && target.role === 'admin') {
        return res.status(403).json({ success: false, message: 'Only super admin can remove another admin' });
      }

      await User.findByIdAndDelete(userId);
      res.json({ success: true, message: 'User removed' });
    } catch (error) {
      console.error('Admin delete user error:', error);
      res.status(500).json({ success: false, message: 'Server error while removing user' });
    }
  }
  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await User.findOne({ email }).populate('travelBuddies', 'name email').populate('joinedTrips');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update online status
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .populate('travelBuddies', 'name email bio location isOnline lastSeen')
        .populate('followedBy', 'name email')
        .populate('joinedTrips');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { name, preferences, bio, location } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (preferences !== undefined) updateData.preferences = preferences;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('travelBuddies', 'name email bio location');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error while updating profile'
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      // Update user's online status
      await User.findByIdAndUpdate(req.user.userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout'
      });
    }
  }

  // Delete user account
  static async deleteAccount(req, res) {
    try {
      const user = await User.findByIdAndDelete(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting account'
      });
    }
  }
}

module.exports = UserController;
