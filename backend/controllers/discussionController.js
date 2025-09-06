// backend/controllers/discussionController.js
const Discussion = require('../models/Discussion');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class DiscussionController {
  // Get trip discussion
  static async getDiscussion(req, res) {
    try {
      const { tripId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Check if user has access to this trip
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      const isOrganizer = trip.organizer.toString() === req.user.userId;
      const isParticipant = trip.participants.some(
        p => p.user.toString() === req.user.userId && p.status === 'confirmed'
      );

      if (!isOrganizer && !isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Only trip organizer or participants can access discussions'
        });
      }

      let discussion = await Discussion.findOne({ trip: tripId })
        .populate('messages.author', 'name email isOnline')
        .populate('activeUsers.user', 'name email isOnline lastSeen');

      if (!discussion) {
        // Create discussion if it doesn't exist
        discussion = new Discussion({
          trip: tripId,
          messages: [{
            messageId: uuidv4(),
            author: req.user.userId,
            content: 'Discussion started for this trip!',
            messageType: 'system',
            timestamp: new Date()
          }]
        });
        await discussion.save();
        await discussion.populate('messages.author', 'name email isOnline');
      }

      // Pagination for messages
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedMessages = discussion.messages
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(skip, skip + parseInt(limit));

      res.json({
        success: true,
        data: {
          discussion: {
            ...discussion.toObject(),
            messages: paginatedMessages
          },
          trip: {
            _id: trip._id,
            title: trip.title,
            collaborativeFeatures: trip.collaborativeFeatures
          }
        }
      });
    } catch (error) {
      console.error('Get discussion error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching discussion'
      });
    }
  }

  // Send message
  static async sendMessage(req, res) {
    try {
      const { tripId } = req.params;
      const { content, messageType = 'text' } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      // Check if user has access to this trip
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      if (!trip.collaborativeFeatures.allowDiscussions) {
        return res.status(403).json({
          success: false,
          message: 'Discussions are disabled for this trip'
        });
      }

      const isOrganizer = trip.organizer.toString() === req.user.userId;
      const isParticipant = trip.participants.some(
        p => p.user.toString() === req.user.userId && p.status === 'confirmed'
      );

      if (!isOrganizer && !isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Only trip organizer or participants can send messages'
        });
      }

      const messageData = {
        messageId: uuidv4(),
        author: req.user.userId,
        content: content.trim(),
        messageType,
        timestamp: new Date()
      };

      // Update discussion
      let discussion = await Discussion.findOneAndUpdate(
        { trip: tripId },
        {
          $push: { messages: messageData },
          $set: {
            [`activeUsers.${req.user.userId}.lastSeen`]: new Date(),
            [`activeUsers.${req.user.userId}.isTyping`]: false
          }
        },
        { new: true, upsert: true }
      ).populate('messages.author', 'name email isOnline');

      // Update trip's last activity
      await Trip.findByIdAndUpdate(tripId, {
        'collaborativeFeatures.lastActivity': new Date()
      });

      // Get the newly added message with populated author
      const newMessage = discussion.messages[discussion.messages.length - 1];

      // Emit socket event for real-time messaging
      const io = req.app.get('io');
      if (io) {
        io.to(`trip-${tripId}`).emit('newMessage', {
          tripId: tripId,
          message: newMessage
        });
      }

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message: newMessage }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while sending message'
      });
    }
  }

  // Update typing status
  static async updateTypingStatus(req, res) {
    try {
      const { tripId } = req.params;
      const { isTyping } = req.body;

      // Check if user has access to this trip
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      const isOrganizer = trip.organizer.toString() === req.user.userId;
      const isParticipant = trip.participants.some(
        p => p.user.toString() === req.user.userId && p.status === 'confirmed'
      );

      if (!isOrganizer && !isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update typing status
      await Discussion.findOneAndUpdate(
        { trip: tripId },
        {
          $set: {
            [`activeUsers.${req.user.userId}.isTyping`]: isTyping,
            [`activeUsers.${req.user.userId}.lastSeen`]: new Date()
          }
        },
        { upsert: true }
      );

      // Get user info
      const user = await User.findById(req.user.userId).select('name');

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`trip-${tripId}`).emit('typingStatus', {
          tripId: tripId,
          user: {
            _id: req.user.userId,
            name: user.name
          },
          isTyping: isTyping
        });
      }

      res.json({
        success: true,
        message: 'Typing status updated'
      });
    } catch (error) {
      console.error('Update typing status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating typing status'
      });
    }
  }

  // Mark user as active in discussion
  static async markUserActive(req, res) {
    try {
      const { tripId } = req.params;

      // Update user's active status
      await Discussion.findOneAndUpdate(
        { trip: tripId },
        {
          $set: {
            [`activeUsers.${req.user.userId}.lastSeen`]: new Date(),
            [`activeUsers.${req.user.userId}.isTyping`]: false
          }
        },
        { upsert: true }
      );

      res.json({
        success: true,
        message: 'User marked as active'
      });
    } catch (error) {
      console.error('Mark user active error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while marking user active'
      });
    }
  }
}

module.exports = DiscussionController; 