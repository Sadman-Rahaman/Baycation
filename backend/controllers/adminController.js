// backend/controllers/adminController.js
const User = require('../models/User');
const Trip = require('../models/Trip');
const Gear = require('../models/Gear');
const GuideVerification = require('../models/GuideVerification');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

class AdminController {
  // Get dashboard overview statistics
  static async getDashboardStats(req, res) {
    try {
      const [
        totalUsers,
        totalTrips,
        totalGear,
        pendingVerifications,
        recentActivity
      ] = await Promise.all([
        User.countDocuments(),
        Trip.countDocuments(),
        // REMOVED: HostedTrip.countDocuments(),
        Gear.countDocuments(),
        GuideVerification.countDocuments({ status: 'pending' }),
        // Recent activity - last 7 days
        User.find({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
          .select('name email createdAt role')
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

      // Get user growth over time
      const userGrowth = await User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]);

      // Get popular destinations
      const popularDestinations = await Trip.aggregate([
        { $group: { _id: '$destination', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Get guide performance (without hosted trips)
      const guidePerformance = await User.aggregate([
        { $match: { role: 'guide', guideStatus: 'verified' } },
        {
          $project: {
            name: 1,
            email: 1,
            'guideInfo.rating': 1,
            'guideInfo.totalBookings': 1,
            'guideInfo.completedTrips': 1
          }
        },
        { $sort: { 'guideInfo.rating.average': -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalTrips,
            // REMOVED: totalHostedTrips,
            totalGear,
            pendingVerifications,
            totalRevenue: totalRevenue[0]?.total || 0
          },
          userGrowth,
          popularDestinations,
          guidePerformance,
          recentActivity
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching dashboard statistics'
      });
    }
  }

  // Get content management data
  static async getContentManagement(req, res) {
    try {
      const { type, status, page = 1, limit = 10 } = req.query;

      let query = {};
      let model;
      let populateFields = '';

      switch (type) {
        case 'trips':
          model = Trip;
          if (status) query.status = status;
          populateFields = 'organizer';
          break;
        // REMOVED: case 'hosted-trips':
        case 'gear':
          model = Gear;
          if (status) query.isActive = status === 'active';
          populateFields = 'seller';
          break;
        case 'users':
          model = User;
          if (status) query.role = status;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid content type'
          });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      let queryBuilder = model.find(query);
      if (populateFields) {
        queryBuilder = queryBuilder.populate(populateFields, 'name email');
      }

      const items = await queryBuilder
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await model.countDocuments(query);

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: items.length,
            totalItems: total
          }
        }
      });
    } catch (error) {
      console.error('Get content management error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching content management data'
      });
    }
  }

  // Approve or reject content
  static async manageContent(req, res) {
    try {
      const { type, id } = req.params;
      const { action, reason } = req.body;
      const adminId = req.user.userId;

      let model;
      let updateData = {};

      switch (type) {
        case 'trip':
          model = Trip;
          updateData = {
            isApproved: action === 'approve',
            approvedAt: action === 'approve' ? new Date() : null,
            approvedBy: action === 'approve' ? adminId : null
          };
          break;
        // REMOVED: case 'hosted-trip':
        case 'gear':
          model = Gear;
          updateData = {
            isApproved: action === 'approve',
            approvedAt: action === 'approve' ? new Date() : null,
            approvedBy: action === 'approve' ? adminId : null,
            isActive: action === 'approve'
          };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid content type'
          });
      }

      const item = await model.findByIdAndUpdate(id, updateData, { new: true });
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      res.json({
        success: true,
        message: `Content ${action}d successfully`,
        data: { item }
      });
    } catch (error) {
      console.error('Manage content error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while managing content'
      });
    }
  }

  // Get reports and analytics
  static async getReports(req, res) {
    try {
      const { type, startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      let reportData = {};

      switch (type) {
        case 'user-registrations':
          reportData = await User.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]);
          break;

        case 'popular-content':
          const [popularTrips, popularGear] = await Promise.all([
            Trip.aggregate([
              { $match: dateFilter },
              { $group: { _id: '$destination', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]),
            Gear.aggregate([
              { $match: dateFilter },
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ])
          ]);

          reportData = {
            popularTrips,
            popularGear
          };
          break;

        case 'guide-performance':
          reportData = await User.aggregate([
            { $match: { role: 'guide', ...dateFilter } },
            {
              $lookup: {
                from: 'ratings',
                localField: '_id',
                foreignField: 'targetId',
                as: 'ratings'
              }
            },
            {
              $project: {
                name: 1,
                email: 1,
                'guideInfo.rating': 1,
                'guideInfo.totalBookings': 1,
                'guideInfo.completedTrips': 1,
                averageRating: { $avg: '$ratings.rating' },
                totalReviews: { $size: '$ratings' }
              }
            },
            { $sort: { averageRating: -1 } },
            { $limit: 20 }
          ]);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type'
          });
      }

      res.json({
        success: true,
        data: { reportData }
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching reports'
      });
    }
  }

  // Get system health metrics
  static async getSystemHealth(req, res) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalTrips,
        activeTrips, 
        totalMessages,
        recentMessages
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isOnline: true }),
        Trip.countDocuments(),
        Trip.countDocuments({ status: { $in: ['open', 'ongoing'] } }),
        Message.countDocuments(),
        Message.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);

      // Calculate system uptime (simplified)
      const uptime = process.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            percentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
          },
          trips: {
            total: totalTrips,
            active: activeTrips,
            percentage: totalTrips > 0 ? Math.round((activeTrips / totalTrips) * 100) : 0
          },
          messages: {
            total: totalMessages,
            last24h: recentMessages
          },
          system: {
            uptime: `${uptimeHours}h ${uptimeMinutes}m`,
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version
          }
        }
      });
    } catch (error) {
      console.error('Get system health error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching system health'
      });
    }
  }

  // Get flagged content
  static async getFlaggedContent(req, res) {
    try {
      const { type, page = 1, limit = 10 } = req.query;

      let query = {};
      let model;

      switch (type) {
        case 'ratings':
          model = Rating;
          query = { reportCount: { $gt: 0 } };
          break;
        case 'users':
          model = User;
          query = { reportCount: { $gt: 0 } };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid content type'
          });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const items = await model.find(query)
        .populate('reviewer', 'name email')
        .sort({ reportCount: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await model.countDocuments(query);

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: items.length,
            totalItems: total
          }
        }
      });
    } catch (error) {
      console.error('Get flagged content error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching flagged content'
      });
    }
  }

  // Moderate flagged content
  static async moderateContent(req, res) {
    try {
      const { type, id } = req.params;
      const { action, reason } = req.body;

      let model;
      let updateData = {};

      switch (type) {
        case 'rating':
          model = Rating;
          updateData = {
            isHidden: action === 'hide',
            reportCount: 0
          };
          break;
        case 'user':
          model = User;
          updateData = {
            isSuspended: action === 'suspend',
            suspensionReason: action === 'suspend' ? reason : null,
            reportCount: 0
          };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid content type'
          });
      }

      const item = await model.findByIdAndUpdate(id, updateData, { new: true });
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      res.json({
        success: true,
        message: `Content ${action}d successfully`,
        data: { item }
      });
    } catch (error) {
      console.error('Moderate content error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while moderating content'
      });
    }
  }
}

module.exports = AdminController;
