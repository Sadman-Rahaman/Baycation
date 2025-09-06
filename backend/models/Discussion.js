// backend/models/Discussion.js
const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  messages: [{
    messageId: {
      type: String,
      required: true,
      unique: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    messageType: {
      type: String,
      enum: ['text', 'system', 'itinerary_update', 'user_joined', 'user_left'],
      default: 'text'
    },
    metadata: {
      itineraryChange: {
        action: String, // 'added', 'updated', 'removed'
        day: Number,
        activity: String
      },
      userAction: {
        action: String, // 'joined', 'left'
        userName: String
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    editedAt: {
      type: Date
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  activeUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isTyping: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    allowAllParticipants: {
      type: Boolean,
      default: true
    },
    allowOnlyOrganizer: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
discussionSchema.index({ trip: 1 });
discussionSchema.index({ 'messages.timestamp': -1 });

module.exports = mongoose.model('Discussion', discussionSchema);
