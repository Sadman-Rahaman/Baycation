const GuideVerification = require('../models/GuideVerification');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class GuideVerificationController {
  // Submit verification application
  static async submitVerification(req, res) {
    try {
      console.log('=== Guide Verification Submission ===');
      console.log('User ID:', req.user.userId);
      console.log('Request Body:', JSON.stringify(req.body, null, 2));

      const userId = req.user.userId;

      // Check for existing verification - FIXED: Changed 'user' to 'applicant'
      const existingVerification = await GuideVerification.findOne({
        applicant: userId,  // FIXED: Changed from 'user' to 'applicant'
        status: { $in: ['pending', 'under_review', 'approved'] }
      });

      if (existingVerification) {
        console.log('User already has verification:', existingVerification.status);
        return res.status(400).json({
          success: false,
          message: `You already have a ${existingVerification.status} verification application`
        });
      }

      // Create new verification - FIXED: Changed 'user' to 'applicant'
      const newVerification = {
        verification_id: uuidv4(),
        applicant: userId,  // FIXED: Changed from 'user' to 'applicant'
        personalInfo: req.body.personalInfo || {},
        professionalInfo: req.body.professionalInfo || {},
        documents: req.body.documents || {},
        references: req.body.references || [],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating verification:', newVerification.verification_id);

      const verification = new GuideVerification(newVerification);
      await verification.save();

      console.log('Verification saved successfully');

      res.status(201).json({
        success: true,
        message: 'Verification application submitted successfully',
        data: { 
          verification: {
            _id: verification._id,
            verification_id: verification.verification_id,
            status: verification.status,
            createdAt: verification.createdAt
          }
        }
      });
    } catch (error) {
      console.error('=== Submit Verification Error ===');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Server error while submitting verification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get verification status
  static async getVerificationStatus(req, res) {
    try {
      const userId = req.user.userId;
      console.log('Getting verification status for user:', userId);

      // FIXED: Changed 'user' to 'applicant'
      const verification = await GuideVerification.findOne({ applicant: userId })
        .sort({ createdAt: -1 });

      if (!verification) {
        console.log('No verification found for user');
        return res.status(404).json({
          success: false,
          message: 'No verification application found'
        });
      }

      console.log('Found verification:', verification.status);

      res.json({
        success: true,
        data: { verification }
      });
    } catch (error) {
      console.error('Get verification status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching verification status'
      });
    }
  }

  // Update verification
  static async updateVerification(req, res) {
    try {
      const { verificationId } = req.params;
      const userId = req.user.userId;
      const updateData = req.body;

      // FIXED: Changed 'user' to 'applicant'
      const verification = await GuideVerification.findOne({
        _id: verificationId,
        applicant: userId,  // FIXED: Changed from 'user' to 'applicant'
        status: 'pending'
      });

      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verification not found or cannot be updated'
        });
      }

      Object.assign(verification, updateData);
      verification.updatedAt = new Date();
      await verification.save();

      res.json({
        success: true,
        message: 'Verification updated successfully',
        data: { verification }
      });
    } catch (error) {
      console.error('Update verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating verification'
      });
    }
  }

  // Admin: Get all verifications
  static async getAllVerifications(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;

      let query = {};
      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // FIXED: Changed 'user' to 'applicant' in populate
      const verifications = await GuideVerification.find(query)
        .populate('applicant', 'name email')  // FIXED: Changed from 'user' to 'applicant'
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await GuideVerification.countDocuments(query);

      res.json({
        success: true,
        data: {
          verifications,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: verifications.length,
            totalVerifications: total
          }
        }
      });
    } catch (error) {
      console.error('Get all verifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching verifications'
      });
    }
  }

  // Admin: Review verification
  static async reviewVerification(req, res) {
    try {
      const { verificationId } = req.params;
      const { status, verificationLevel, notes, rejectionReason } = req.body;
      const reviewerId = req.user.userId;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be approved or rejected'
        });
      }

      const verification = await GuideVerification.findById(verificationId);
      
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verification not found'
        });
      }

      verification.status = status;
      
      if (status === 'approved') {
        verification.verificationLevel = verificationLevel || 'basic';
        verification.approvedAt = new Date();
      }

      verification.review = {
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        comments: notes || '',
        rejectionReason: status === 'rejected' ? rejectionReason : null
      };

      await verification.save();

      // Update user's guide status if approved - FIXED: using 'applicant' field
      if (status === 'approved') {
        await User.findByIdAndUpdate(verification.applicant, {  // FIXED: Changed from 'verification.user' to 'verification.applicant'
          role: 'guide',
          guideStatus: 'verified',
          'guideInfo.verificationLevel': verification.verificationLevel,
          'guideInfo.verifiedAt': new Date()
        });
      }

      res.json({
        success: true,
        message: `Verification ${status} successfully`,
        data: { verification }
      });
    } catch (error) {
      console.error('Review verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while reviewing verification'
      });
    }
  }

  // Admin: Get verification statistics
  static async getVerificationStats(req, res) {
    try {
      const stats = await GuideVerification.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const formattedStats = {
        total: 0,
        pending: 0,
        under_review: 0,
        approved: 0,
        rejected: 0
      };

      stats.forEach(stat => {
        formattedStats[stat._id] = stat.count;
        formattedStats.total += stat.count;
      });

      res.json({
        success: true,
        data: {
          stats: formattedStats
        }
      });
    } catch (error) {
      console.error('Get verification stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching statistics'
      });
    }
  }
}

module.exports = GuideVerificationController;
