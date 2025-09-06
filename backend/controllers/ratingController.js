// backend/controllers/ratingController.js
const Rating = require('../models/Rating');
const User = require('../models/User');
const Trip = require('../models/Trip');
// REMOVED: const HostedTrip = require('../models/HostedTrip');
const { v4: uuidv4 } = require('uuid');

class RatingController {
  // Create or update rating
  static async createRating(req, res) {
    try {
      const { targetType, targetId, rating, review } = req.body;
      const reviewerId = req.user.userId;

      // Validate target exists
      let target;
      switch (targetType) {
        case 'guide':
          target = await User.findById(targetId);
          if (!target || target.role !== 'guide') {
            return res.status(404).json({
              success: false,
              message: 'Guide not found'
            });
          }
          break;
        case 'trip':
          target = await Trip.findById(targetId);
          if (!target) {
            return res.status(404).json({
              success: false,
              message: 'Trip not found'
            });
          }
          break;
        // REMOVED: case 'hosted-trip' block
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid target type'
          });
      }

      // Check if user has already rated
      let existingRating = await Rating.findOne({
        reviewer: reviewerId,
        targetType,
        targetId
      });

      if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        existingRating.review = review;
        await existingRating.save();

        res.json({
          success: true,
          message: 'Rating updated successfully',
          data: { rating: existingRating }
        });
      } else {
        // Create new rating
        const newRating = new Rating({
          rating_id: uuidv4(),
          reviewer: reviewerId,
          targetType,
          targetId,
          rating,
          review
        });

        await newRating.save();

        // Update target's average rating if it's a guide
        if (targetType === 'guide') {
          await updateGuideRating(targetId);
        }

        res.status(201).json({
          success: true,
          message: 'Rating created successfully',
          data: { rating: newRating }
        });
      }
    } catch (error) {
      console.error('Create rating error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating rating'
      });
    }
  }

  // Get ratings for a target
  static async getRatings(req, res) {
    try {
      const { targetType, targetId } = req.params;
      const { page = 1, limit = 10, sort = 'newest' } = req.query;

      const query = {
        targetType,
        targetId,
        isHidden: false
      };

      let sortQuery = {};
      if (sort === 'newest') {
        sortQuery = { createdAt: -1 };
      } else if (sort === 'helpful') {
        sortQuery = { helpfulVotes: -1 };
      } else if (sort === 'rating-high') {
        sortQuery = { rating: -1 };
      } else if (sort === 'rating-low') {
        sortQuery = { rating: 1 };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const ratings = await Rating.find(query)
        .populate('reviewer', 'name email')
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Rating.countDocuments(query);

      // Calculate rating statistics
      const stats = await Rating.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
            distribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      // Calculate rating distribution
      let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      if (stats.length > 0 && stats[0].distribution) {
        stats[0].distribution.forEach(rating => {
          distribution[rating]++;
        });
      }

      res.json({
        success: true,
        data: {
          ratings,
          stats: {
            average: stats[0]?.averageRating || 0,
            total: stats[0]?.totalRatings || 0,
            distribution
          },
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: ratings.length,
            totalRatings: total
          }
        }
      });
    } catch (error) {
      console.error('Get ratings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching ratings'
      });
    }
  }

  // Vote on rating helpfulness
  static async voteHelpful(req, res) {
    try {
      const { ratingId } = req.params;
      const { isHelpful } = req.body;

      const rating = await Rating.findById(ratingId);
      
      if (!rating) {
        return res.status(404).json({
          success: false,
          message: 'Rating not found'
        });
      }

      // Simple implementation - increment or decrement
      if (isHelpful) {
        rating.helpfulVotes += 1;
      } else if (rating.helpfulVotes > 0) {
        rating.helpfulVotes -= 1;
      }

      await rating.save();

      res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: { helpfulVotes: rating.helpfulVotes }
      });
    } catch (error) {
      console.error('Vote helpful error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while voting'
      });
    }
  }

  // Report a rating
  static async reportRating(req, res) {
    try {
      const { ratingId } = req.params;
      const { reason } = req.body;

      const rating = await Rating.findById(ratingId);
      
      if (!rating) {
        return res.status(404).json({
          success: false,
          message: 'Rating not found'
        });
      }

      rating.reportCount += 1;
      
      // Auto-hide if too many reports
      if (rating.reportCount >= 5) {
        rating.isHidden = true;
      }

      await rating.save();

      res.json({
        success: true,
        message: 'Rating reported successfully'
      });
    } catch (error) {
      console.error('Report rating error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while reporting rating'
      });
    }
  }

  // Get user's ratings
  static async getUserRatings(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const ratings = await Rating.find({ reviewer: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Rating.countDocuments({ reviewer: userId });

      res.json({
        success: true,
        data: {
          ratings,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: ratings.length,
            totalRatings: total
          }
        }
      });
    } catch (error) {
      console.error('Get user ratings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching user ratings'
      });
    }
  }
}

// Helper function to update guide rating
async function updateGuideRating(guideId) {
  try {
    const ratings = await Rating.find({
      targetType: 'guide',
      targetId: guideId,
      isHidden: false
    });

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = Math.round((totalRating / ratings.length) * 10) / 10;

      await User.findByIdAndUpdate(guideId, {
        'guideInfo.rating.average': avgRating,
        'guideInfo.rating.count': ratings.length
      });
    }
  } catch (error) {
    console.error('Error updating guide rating:', error);
  }
}

module.exports = RatingController;
