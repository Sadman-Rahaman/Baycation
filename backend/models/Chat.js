// backend/models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chat_id: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['traveler', 'guide', 'admin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  chatType: {
    type: String,
    enum: ['direct', 'group', 'trip', 'support'],
    required: true
  },
  title: String,
  description: String,
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  hostedTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostedTrip'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Ensure unique participants for direct chats
chatSchema.index({ participants: 1, chatType: 1 }, { unique: true, partialFilterExpression: { chatType: 'direct' } });

module.exports = mongoose.model('Chat', chatSchema);
