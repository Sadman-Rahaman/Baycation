// backend/controllers/tripController.js
const Trip = require('../models/Trip');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class TripController {
  // Create new trip
  static async createTrip(req, res) {
    try {
      const {
        title,
        description,
        destination,
        startDate,
        endDate,
        maxParticipants,
        budget,
        difficulty,
        tripType,
        tags,
        requirements,
        isPublic,
      } = req.body;

      const trip = new Trip({
        trip_id: uuidv4(),
        title,
        description,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxParticipants,
        budget,
        difficulty,
        tripType,
        organizer: req.user.userId,
        tags: tags || [],
        requirements: requirements || [],
        isPublic: isPublic !== undefined ? isPublic : true,
        status: 'planning',
        isApproved: false,
      });

      await trip.save();
      await trip.populate('organizer', 'name email');

      // Add trip to user's joined trips
      await User.findByIdAndUpdate(req.user.userId, {
        $push: { joinedTrips: trip._id }
      });

      // Do not broadcast until approved

      res.status(201).json({
        success: true,
        message: 'Trip submitted for approval',
        data: { trip }
      });
    } catch (error) {
      console.error('Create trip error:', error);
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
        message: 'Server error while creating trip'
      });
    }
  }

  // Admin: list pending trips (not approved yet)
  static async getPendingTrips(req, res) {
    try {
      const approver = await User.findById(req.user.userId).select('role email');
      const superEmail = process.env.SUPER_ADMIN_EMAIL;
      const superId = process.env.SUPER_ADMIN_ID;
      const isSuperAdmin = !!approver && (
        (superEmail && approver.email === superEmail) ||
        (superId && req.user.userId && req.user.userId.toString() === superId.toString())
      );
      if (!approver || (approver.role !== 'admin' && !isSuperAdmin)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const trips = await Trip.find({ isPublic: true, isApproved: false })
        .populate('organizer', 'name email')
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({ success: true, data: { trips } });
    } catch (error) {
      console.error('Get pending trips error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching pending trips' });
    }
  }

  // Admin: approve a trip
  static async approveTrip(req, res) {
    try {
      const { tripId } = req.params;

      // Admins or Super Admin (by env) can approve
      const approver = await User.findById(req.user.userId).select('role name email');
      const superEmail = process.env.SUPER_ADMIN_EMAIL;
      const superId = process.env.SUPER_ADMIN_ID;
      const isSuperAdmin = !!approver && (
        (superEmail && approver.email === superEmail) ||
        (superId && req.user.userId && req.user.userId.toString() === superId.toString())
      );
      if (!approver || (approver.role !== 'admin' && !isSuperAdmin)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const trip = await Trip.findByIdAndUpdate(
        tripId,
        { isApproved: true, approvedAt: new Date(), approvedBy: approver._id },
        { new: true }
      ).populate('organizer', 'name email');

      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      // Broadcast newly approved trip
      const io = req.app.get('io');
      if (io) {
        io.emit('tripCreated', {
          trip: trip,
          organizer: { name: trip.organizer.name, _id: trip.organizer._id }
        });
      }

      res.json({ success: true, message: 'Trip approved', data: { trip } });
    } catch (error) {
      console.error('Approve trip error:', error);
      res.status(500).json({ success: false, message: 'Server error while approving trip' });
    }
  }

  // Get feed: trips from users I follow
  static async getFollowedFeed(req, res) {
    try {
      const user = await User.findById(req.user.userId).select('travelBuddies');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const followedIds = Array.isArray(user.travelBuddies) ? user.travelBuddies : [];

      if (followedIds.length === 0) {
        return res.json({ success: true, data: { trips: [] } });
      }

      const trips = await Trip.find({
        isPublic: true,
        $or: [
          { organizer: { $in: followedIds } },
          { 'participants.user': { $in: followedIds } }
        ]
      })
        .populate('organizer', 'name email')
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({
        success: true,
        data: { trips }
      });
    } catch (error) {
      console.error('Get followed feed error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching feed' });
    }
  }

  // Get all public trips
  static async getAllTrips(req, res) {
    try {
      const { 
        destination, 
        tripType, 
        difficulty, 
        minBudget, 
        maxBudget,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 10
      } = req.query;

      let query = { isPublic: true, isApproved: true };

      // Build search query
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { destination: { $regex: search, $options: 'i' } }
        ];
      }

      if (destination) {
        query.destination = { $regex: destination, $options: 'i' };
      }

      if (tripType) {
        query.tripType = tripType;
      }

      if (difficulty) {
        query.difficulty = difficulty;
      }

      if (minBudget || maxBudget) {
        query['budget.min'] = {};
        if (minBudget) query['budget.min'].$gte = parseInt(minBudget);
        if (maxBudget) query['budget.max'] = { $lte: parseInt(maxBudget) };
      }

      if (startDate) {
        query.startDate = { $gte: new Date(startDate) };
      }

      if (endDate) {
        query.endDate = { $lte: new Date(endDate) };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const trips = await Trip.find(query)
        .populate('organizer', 'name email bio')
        .populate('participants.user', 'name email')
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Trip.countDocuments(query);

      res.json({
        success: true,
        data: {
          trips,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: trips.length,
            totalTrips: total
          }
        }
      });
    } catch (error) {
      console.error('Get all trips error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching trips'
      });
    }
  }

  // Get single trip
  static async getTrip(req, res) {
    try {
      const { tripId } = req.params;

      const trip = await Trip.findById(tripId)
        .populate('organizer', 'name email bio location isOnline lastSeen')
        .populate('participants.user', 'name email bio isOnline lastSeen');

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      res.json({
        success: true,
        data: { trip }
      });
    } catch (error) {
      console.error('Get trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching trip'
      });
    }
  }

  // Update trip
  static async updateTrip(req, res) {
    try {
      const { tripId } = req.params;
      const updateData = req.body;

      const trip = await Trip.findById(tripId);
      
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      // Check if user is the organizer
      if (trip.organizer.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only trip organizer can update this trip'
        });
      }

      // Update trip
      Object.assign(trip, updateData);
      await trip.save();
      await trip.populate('organizer', 'name email');

      // Emit socket event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`trip-${tripId}`).emit('tripUpdated', {
          trip: trip,
          updatedBy: req.user.userId
        });
      }

      res.json({
        success: true,
        message: 'Trip updated successfully',
        data: { trip }
      });
    } catch (error) {
      console.error('Update trip error:', error);
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
        message: 'Server error while updating trip'
      });
    }
  }

  // Delete trip
  static async deleteTrip(req, res) {
    try {
      const { tripId } = req.params;

      const trip = await Trip.findById(tripId);
      
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      // Allow organizer OR any admin (including super admin) to delete
      const requester = await User.findById(req.user.userId).select('role email');
      const superEmail = process.env.SUPER_ADMIN_EMAIL;
      const superId = process.env.SUPER_ADMIN_ID;
      const isSuperAdmin = !!requester && (
        (superEmail && requester.email === superEmail) ||
        (superId && req.user.userId && req.user.userId.toString() === superId.toString())
      );

      const isOrganizer = trip.organizer.toString() === req.user.userId;
      const isAdmin = requester && requester.role === 'admin';
      if (!isOrganizer && !isAdmin && !isSuperAdmin) {
        return res.status(403).json({ success: false, message: 'Only organizer or admin can delete this trip' });
      }

      await Trip.findByIdAndDelete(tripId);

      // Remove trip from all users' joined trips
      await User.updateMany(
        { joinedTrips: tripId },
        { $pull: { joinedTrips: tripId } }
      );

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`trip-${tripId}`).emit('tripDeleted', {
          tripId: tripId,
          deletedBy: req.user.userId
        });
      }

      res.json({
        success: true,
        message: 'Trip deleted successfully'
      });
    } catch (error) {
      console.error('Delete trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting trip'
      });
    }
  }

  // Join trip - FIXED
  static async joinTrip(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user.userId;

      console.log('Join trip request - Trip ID:', tripId, 'User ID:', userId);

      const trip = await Trip.findById(tripId).populate('organizer', 'name');
      
      if (!trip) {
        console.log('Trip not found:', tripId);
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      console.log('Trip found:', trip.title);
      console.log('Trip approved status:', trip.isApproved);
      console.log('Trip status:', trip.status);
      console.log('Current participants:', trip.currentParticipants, '/', trip.maxParticipants);

      // Check if trip is approved
      if (!trip.isApproved) {
        console.log('Trip not approved yet');
        return res.status(400).json({
          success: false,
          message: 'This trip is pending approval and not open for joining yet'
        });
      }

      // Check if trip is full
      if (trip.currentParticipants >= trip.maxParticipants) {
        console.log('Trip is full');
        return res.status(400).json({
          success: false,
          message: 'Trip is full'
        });
      }

      // Check trip status
      if (trip.status === 'completed' || trip.status === 'cancelled') {
        console.log('Trip status not accepting participants:', trip.status);
        return res.status(400).json({
          success: false,
          message: 'This trip is not accepting participants'
        });
      }

      // Check if user is the organizer
      if (trip.organizer._id.toString() === userId) {
        console.log('User is the organizer, cannot join own trip');
        return res.status(400).json({
          success: false,
          message: 'You cannot join your own trip'
        });
      }

      // FIXED: Properly check if user already joined
      // Handle both populated and non-populated user fields
      const alreadyJoined = trip.participants.some(p => {
        // If p.user is populated (has _id property), compare _id
        if (p.user && typeof p.user === 'object' && p.user._id) {
          return p.user._id.toString() === userId;
        }
        // If p.user is just an ObjectId, compare directly
        return p.user && p.user.toString() === userId;
      });

      console.log('Already joined check:', alreadyJoined);

      if (alreadyJoined) {
        console.log('User already joined this trip');
        return res.status(400).json({
          success: false,
          message: 'You have already joined this trip'
        });
      }

      // Add participant
      trip.participants.push({
        user: userId,
        status: 'confirmed',
        joinedAt: new Date()
      });

      console.log('Adding participant to trip');

      // Update participant count
      trip.updateParticipantCount();
      await trip.save();

      console.log('Trip saved with new participant');

      // Add trip to user's joined trips
      await User.findByIdAndUpdate(userId, {
        $addToSet: { joinedTrips: tripId } // Use $addToSet to avoid duplicates
      });

      console.log('Updated user joined trips');

      // Get user info for notifications
      const user = await User.findById(userId).select('name email');

      // Populate trip for response
      await trip.populate('participants.user', 'name email');

      // Emit socket events
      const io = req.app.get('io');
      if (io) {
        io.to(`trip-${tripId}`).emit('userJoined', {
          trip: trip,
          user: user
        });
        io.emit('tripUpdated', { trip: trip });
      }

      res.json({
        success: true,
        message: 'Successfully joined the trip',
        data: { trip }
      });
    } catch (error) {
      console.error('Join trip error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Server error while joining trip',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Leave trip
  static async leaveTrip(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user.userId;

      const trip = await Trip.findById(tripId);
      
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      // Check if user is organizer
      if (trip.organizer.toString() === userId) {
        return res.status(400).json({
          success: false,
          message: 'Trip organizer cannot leave the trip. Delete the trip instead.'
        });
      }

      // Remove participant
      trip.participants = trip.participants.filter(
        p => p.user.toString() !== userId
      );

      trip.updateParticipantCount();
      await trip.save();

      // Remove trip from user's joined trips
      await User.findByIdAndUpdate(userId, {
        $pull: { joinedTrips: tripId }
      });

      // Get user info for notifications
      const user = await User.findById(userId).select('name email');
      
      // Emit socket events
      const io = req.app.get('io');
      if (io) {
        io.to(`trip-${tripId}`).emit('userLeft', {
          trip: trip,
          user: user
        });
        io.emit('tripUpdated', { trip: trip });
      }

      res.json({
        success: true,
        message: 'Successfully left the trip'
      });
    } catch (error) {
      console.error('Leave trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while leaving trip'
      });
    }
  }

  // Get user's trips (organized and joined)
  static async getUserTrips(req, res) {
    try {
      const userId = req.user.userId;
      const { type = 'all' } = req.query;

      let query = {};

      if (type === 'organized') {
        query.organizer = userId;
      } else if (type === 'joined') {
        query['participants.user'] = userId;
      } else {
        query.$or = [
          { organizer: userId },
          { 'participants.user': userId }
        ];
      }

      const trips = await Trip.find(query)
        .populate('organizer', 'name email')
        .populate('participants.user', 'name email');
        
      res.json({
        success: true,
        data: { trips }
      });
    } catch (error) {
      console.error('Get user trips error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching user trips'
      });
    }
  }

  // Update trip itinerary
  static async updateItinerary(req, res) {
    try {
      const { tripId } = req.params;
      const { itinerary } = req.body;

      const trip = await Trip.findById(tripId);
      
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      // Check if user is organizer or participant
      const isOrganizer = trip.organizer.toString() === req.user.userId;
      const isParticipant = trip.participants.some(
        p => p.user.toString() === req.user.userId && p.status === 'confirmed'
      );

      if (!isOrganizer && !isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Only trip organizer or participants can update itinerary'
        });
      }

      // Add metadata to activities
      const updatedItinerary = itinerary.map(day => ({
        ...day,
        activities: day.activities.map(activity => ({
          ...activity,
          addedBy: activity.addedBy || req.user.userId,
          addedAt: activity.addedAt || new Date()
        }))
      }));

      trip.itinerary = updatedItinerary;
      await trip.save();

      // Get user info
      const user = await User.findById(req.user.userId).select('name');

      // Emit socket event for real-time collaboration
      const io = req.app.get('io');
      if (io) {
        io.to(`trip-${tripId}`).emit('itineraryUpdated', {
          trip: trip,
          updatedBy: {
            _id: req.user.userId,
            name: user.name
          },
          itinerary: updatedItinerary
        });
      }

      res.json({
        success: true,
        message: 'Itinerary updated successfully',
        data: { trip }
      });
    } catch (error) {
      console.error('Update itinerary error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating itinerary'
      });
    }
  }
}

module.exports = TripController;
