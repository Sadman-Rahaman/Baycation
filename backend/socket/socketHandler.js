// backend/socket/socketHandler.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Trip = require('../models/Trip');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

// Setup Socket.IO handlers
const setupSocket = (io) => {
  // Use authentication middleware
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);

    // Update user online status
    try {
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating user online status:', error);
    }

    // Join user's trip rooms
    try {
      const userTrips = await Trip.find({
        $or: [
          { organizer: socket.userId },
          { 'participants.user': socket.userId, 'participants.status': 'confirmed' }
        ]
      }).select('_id');

      userTrips.forEach(trip => {
        socket.join(`trip-${trip._id}`);
        console.log(`User ${socket.user.name} joined room: trip-${trip._id}`);
      });
    } catch (error) {
      console.error('Error joining trip rooms:', error);
    }

    // Handle joining specific trip room
    socket.on('joinTrip', async (tripId) => {
      try {
        // Verify user has access to this trip
        const trip = await Trip.findById(tripId);
        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        const isOrganizer = trip.organizer.toString() === socket.userId;
        const isParticipant = trip.participants.some(
          p => p.user.toString() === socket.userId && p.status === 'confirmed'
        );

        if (isOrganizer || isParticipant) {
          socket.join(`trip-${tripId}`);
          
          // Update active users in discussion
          await Discussion.findOneAndUpdate(
            { trip: tripId },
            {
              $set: {
                [`activeUsers.${socket.userId}`]: {
                  user: socket.userId,
                  lastSeen: new Date(),
                  isTyping: false
                }
              }
            },
            { upsert: true }
          );

          socket.emit('joinedTrip', { tripId });
          console.log(`User ${socket.user.name} joined trip room: ${tripId}`);
        } else {
          socket.emit('error', { message: 'Access denied to this trip' });
        }
      } catch (error) {
        console.error('Error joining trip:', error);
        socket.emit('error', { message: 'Error joining trip' });
      }
    });

    // Handle leaving specific trip room
    socket.on('leaveTrip', async (tripId) => {
      try {
        socket.leave(`trip-${tripId}`);
        
        // Update active users in discussion
        await Discussion.findOneAndUpdate(
          { trip: tripId },
          {
            $unset: { [`activeUsers.${socket.userId}`]: "" }
          }
        );

        socket.emit('leftTrip', { tripId });
        console.log(`User ${socket.user.name} left trip room: ${tripId}`);
      } catch (error) {
        console.error('Error leaving trip:', error);
      }
    });

    // Handle real-time messaging
    socket.on('sendMessage', async (data) => {
      try {
        const { tripId, content, messageType = 'text' } = data;

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        // Verify access
        const trip = await Trip.findById(tripId);
        if (!trip || !trip.collaborativeFeatures.allowDiscussions) {
          socket.emit('error', { message: 'Discussions not allowed for this trip' });
          return;
        }

        const isOrganizer = trip.organizer.toString() === socket.userId;
        const isParticipant = trip.participants.some(
          p => p.user.toString() === socket.userId && p.status === 'confirmed'
        );

        if (!isOrganizer && !isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create message
        const messageData = {
          messageId: require('uuid').v4(),
          author: socket.userId,
          content: content.trim(),
          messageType,
          timestamp: new Date()
        };

        // Add to discussion
        const discussion = await Discussion.findOneAndUpdate(
          { trip: tripId },
          { $push: { messages: messageData } },
          { new: true, upsert: true }
        ).populate('messages.author', 'name email isOnline');

        // Update trip activity
        await Trip.findByIdAndUpdate(tripId, {
          'collaborativeFeatures.lastActivity': new Date()
        });

        const newMessage = discussion.messages[discussion.messages.length - 1];

        // Broadcast to trip room
        io.to(`trip-${tripId}`).emit('newMessage', {
          tripId,
          message: newMessage
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', async (data) => {
      try {
        const { tripId, isTyping } = data;

        // Update typing status
        await Discussion.findOneAndUpdate(
          { trip: tripId },
          {
            $set: {
              [`activeUsers.${socket.userId}.isTyping`]: isTyping,
              [`activeUsers.${socket.userId}.lastSeen`]: new Date()
            }
          },
          { upsert: true }
        );

        // Broadcast typing status to others in the room (exclude sender)
        socket.to(`trip-${tripId}`).emit('typingStatus', {
          tripId,
          user: {
            _id: socket.userId,
            name: socket.user.name
          },
          isTyping
        });

      } catch (error) {
        console.error('Error handling typing:', error);
      }
    });

    // Handle real-time itinerary updates
    socket.on('updateItinerary', async (data) => {
      try {
        const { tripId, itinerary, changeInfo } = data;

        // Verify access and permissions
        const trip = await Trip.findById(tripId);
        if (!trip || !trip.collaborativeFeatures.allowItineraryEditing) {
          socket.emit('error', { message: 'Itinerary editing not allowed' });
          return;
        }

        const isOrganizer = trip.organizer.toString() === socket.userId;
        const isParticipant = trip.participants.some(
          p => p.user.toString() === socket.userId && p.status === 'confirmed'
        );

        if (!isOrganizer && !isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Update itinerary
        trip.itinerary = itinerary;
        trip.collaborativeFeatures.lastActivity = new Date();
        await trip.save();

        // Add system message to discussion
        if (trip.collaborativeFeatures.allowDiscussions && changeInfo) {
          await Discussion.findOneAndUpdate(
            { trip: tripId },
            {
              $push: {
                messages: {
                  messageId: require('uuid').v4(),
                  author: socket.userId,
                  content: `${socket.user.name} ${changeInfo.action} ${changeInfo.description}`,
                  messageType: 'itinerary_update',
                  metadata: {
                    itineraryChange: changeInfo
                  },
                  timestamp: new Date()
                }
              }
            }
          );
        }

        // Broadcast to trip room (exclude sender)
        socket.to(`trip-${tripId}`).emit('itineraryUpdated', {
          tripId,
          itinerary,
          updatedBy: {
            _id: socket.userId,
            name: socket.user.name
          },
          changeInfo
        });

      } catch (error) {
        console.error('Error updating itinerary:', error);
        socket.emit('error', { message: 'Error updating itinerary' });
      }
    });

    // Handle activity updates (like user presence)
    socket.on('updateActivity', async (data) => {
      try {
        const { tripId } = data;

        await Discussion.findOneAndUpdate(
          { trip: tripId },
          {
            $set: {
              [`activeUsers.${socket.userId}.lastSeen`]: new Date()
            }
          },
          { upsert: true }
        );

        // Broadcast user activity to trip room
        socket.to(`trip-${tripId}`).emit('userActivity', {
          tripId,
          user: {
            _id: socket.userId,
            name: socket.user.name
          },
          lastSeen: new Date()
        });

      } catch (error) {
        console.error('Error updating activity:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`User ${socket.user.name} disconnected: ${reason}`);
      
      try {
        // Update user offline status
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        // Remove from all active discussions
        await Discussion.updateMany(
          { [`activeUsers.${socket.userId}`]: { $exists: true } },
          {
            $unset: { [`activeUsers.${socket.userId}`]: "" }
          }
        );

        // Notify all trip rooms about user going offline
        const userTrips = await Trip.find({
          $or: [
            { organizer: socket.userId },
            { 'participants.user': socket.userId, 'participants.status': 'confirmed' }
          ]
        }).select('_id');

        userTrips.forEach(trip => {
          socket.to(`trip-${trip._id}`).emit('userOffline', {
            tripId: trip._id.toString(),
            user: {
              _id: socket.userId,
              name: socket.user.name
            }
          });
        });

      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.name}:`, error);
    });
  });

  // Global error handler
  io.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
};

module.exports = setupSocket;
