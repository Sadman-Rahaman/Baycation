// backend/controllers/gearController.js
const Gear = require('../models/Gear');
const Order = require('../models/Order');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class GearController {
  // Create new gear listing
  static async createGear(req, res) {
    try {
      // Important: Set the values AFTER spreading req.body to ensure they're not overwritten
      const gearData = {
        ...req.body,
        gear_id: uuidv4(),
        seller: req.user.userId,
        isApproved: true,  // No admin approval required
        isActive: true,    // Make it immediately visible
        approvedAt: new Date(),
        approvedBy: req.user.userId
      };

      console.log('Creating gear with data:', gearData); // Debug log

      const gear = new Gear(gearData);
      await gear.save();
      await gear.populate('seller', 'name email');

      console.log('Gear created successfully:', gear); // Debug log

      res.status(201).json({
        success: true,
        message: 'Gear listing created successfully',
        data: { gear }
      });
    } catch (error) {
      console.error('Create gear error:', error);
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
        message: 'Server error while creating gear listing'
      });
    }
  }

  // Get all gear with filters
  static async getAllGear(req, res) {
    try {
      const {
        category,
        subcategory,
        priceType,
        minPrice,
        maxPrice,
        condition,
        location,
        search,
        page = 1,
        limit = 12,
        sort = 'newest'
      } = req.query;

      // Only show active and approved gear
      let query = { isActive: true, isApproved: true };

      console.log('Gear query:', query); // Debug log

      // Build search query
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      if (category) {
        query.category = category;
      }

      if (subcategory) {
        query.subcategory = subcategory;
      }

      if (priceType) {
        query['price.type'] = priceType;
      }

      if (minPrice || maxPrice) {
        query['price.amount'] = {};
        if (minPrice) query['price.amount'].$gte = parseInt(minPrice);
        if (maxPrice) query['price.amount'].$lte = parseInt(maxPrice);
      }

      if (condition) {
        query.condition = condition;
      }

      if (location) {
        query.$or = [
          { 'location.city': { $regex: location, $options: 'i' } },
          { 'location.country': { $regex: location, $options: 'i' } }
        ];
      }

      let sortQuery = {};
      switch (sort) {
        case 'newest':
          sortQuery = { createdAt: -1 };
          break;
        case 'oldest':
          sortQuery = { createdAt: 1 };
          break;
        case 'price_low':
          sortQuery = { 'price.amount': 1 };
          break;
        case 'price_high':
          sortQuery = { 'price.amount': -1 };
          break;
        case 'popular':
          sortQuery = { viewCount: -1 };
          break;
        default:
          sortQuery = { createdAt: -1 };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const gear = await Gear.find(query)
        .populate('seller', 'name email guideStatus')
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Gear.countDocuments(query);

      console.log(`Found ${gear.length} gear items out of ${total} total`); // Debug log

      res.json({
        success: true,
        data: {
          gear,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: gear.length,
            totalGear: total
          }
        }
      });
    } catch (error) {
      console.error('Get all gear error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching gear'
      });
    }
  }

  // Get single gear item
  static async getGear(req, res) {
    try {
      const { gearId } = req.params;

      const gear = await Gear.findById(gearId)
        .populate('seller', 'name email guideStatus guideInfo.rating');

      if (!gear) {
        return res.status(404).json({
          success: false,
          message: 'Gear not found'
        });
      }

      // Increment view count
      gear.viewCount += 1;
      await gear.save();

      res.json({
        success: true,
        data: { gear }
      });
    } catch (error) {
      console.error('Get gear error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching gear'
      });
    }
  }

  // Update gear listing
  static async updateGear(req, res) {
    try {
      const { gearId } = req.params;
      const updateData = req.body;

      const gear = await Gear.findById(gearId);
      
      if (!gear) {
        return res.status(404).json({
          success: false,
          message: 'Gear not found'
        });
      }

      // Check if user is the seller
      if (gear.seller.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the seller can update this listing'
        });
      }

      Object.assign(gear, updateData);
      await gear.save();
      await gear.populate('seller', 'name email');

      res.json({
        success: true,
        message: 'Gear listing updated successfully',
        data: { gear }
      });
    } catch (error) {
      console.error('Update gear error:', error);
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
        message: 'Server error while updating gear'
      });
    }
  }

  // Delete gear listing
  static async deleteGear(req, res) {
    try {
      const { gearId } = req.params;

      const gear = await Gear.findById(gearId);
      
      if (!gear) {
        return res.status(404).json({
          success: false,
          message: 'Gear not found'
        });
      }

      // Check if user is the seller or admin
      const user = await User.findById(req.user.userId);
      const isSeller = gear.seller.toString() === req.user.userId;
      const isAdmin = user && user.role === 'admin';

      if (!isSeller && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the seller or admin can delete this listing'
        });
      }

      await Gear.findByIdAndDelete(gearId);

      res.json({
        success: true,
        message: 'Gear listing deleted successfully'
      });
    } catch (error) {
      console.error('Delete gear error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting gear'
      });
    }
  }

  // Get user's gear listings
  static async getUserGear(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, status = 'all' } = req.query;

      let query = { seller: userId };

      if (status !== 'all') {
        query.isActive = status === 'active';
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const gear = await Gear.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Gear.countDocuments(query);

      res.json({
        success: true,
        data: {
          gear,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: gear.length,
            totalGear: total
          }
        }
      });
    } catch (error) {
      console.error('Get user gear error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching user gear'
      });
    }
  }

  // Add to wishlist
  static async addToWishlist(req, res) {
    try {
      const { gearId } = req.params;
      const userId = req.user.userId;

      const gear = await Gear.findById(gearId);
      
      if (!gear) {
        return res.status(404).json({
          success: false,
          message: 'Gear not found'
        });
      }

      // Add to user's wishlist (would need to implement in User model)
      const user = await User.findById(userId);
      if (!user.wishlist) {
        user.wishlist = [];
      }

      const alreadyInWishlist = user.wishlist.some(
        item => item.toString() === gearId
      );

      if (alreadyInWishlist) {
        // Remove from wishlist
        user.wishlist = user.wishlist.filter(
          item => item.toString() !== gearId
        );
        gear.wishlistCount = Math.max(0, gear.wishlistCount - 1);
      } else {
        // Add to wishlist
        user.wishlist.push(gearId);
        gear.wishlistCount += 1;
      }

      await user.save();
      await gear.save();

      res.json({
        success: true,
        message: alreadyInWishlist ? 'Removed from wishlist' : 'Added to wishlist',
        data: {
          isWishlisted: !alreadyInWishlist,
          wishlistCount: gear.wishlistCount
        }
      });
    } catch (error) {
      console.error('Add to wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating wishlist'
      });
    }
  }

  // Get gear categories
  static async getCategories(req, res) {
    try {
      const categories = [
        {
          name: 'clothing',
          label: 'Clothing',
          icon: '👕',
          subcategories: ['Jackets', 'Pants', 'Shirts', 'Shoes', 'Accessories']
        },
        {
          name: 'equipment',
          label: 'Equipment',
          icon: '🎒',
          subcategories: ['Backpacks', 'Tents', 'Sleeping Bags', 'Cooking', 'Tools']
        },
        {
          name: 'electronics',
          label: 'Electronics',
          icon: '📷',
          subcategories: ['Cameras', 'Drones', 'GPS', 'Power Banks', 'Adapters']
        },
        {
          name: 'accessories',
          label: 'Accessories',
          icon: '🧳',
          subcategories: ['Luggage', 'Travel Pillows', 'Locks', 'Organizers', 'Maps']
        },
        {
          name: 'safety',
          label: 'Safety',
          icon: '🦺',
          subcategories: ['First Aid', 'Insurance', 'Emergency', 'Protection']
        },
        {
          name: 'other',
          label: 'Other',
          icon: '📦',
          subcategories: ['Books', 'Guides', 'Miscellaneous']
        }
      ];

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching categories'
      });
    }
  }
}

module.exports = GearController;
