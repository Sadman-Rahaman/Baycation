// backend/models/Trip.js
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  trip_id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Trip description is required'],
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true
  },
  itinerary: [{
    day: {
      type: Number,
      required: true
    },
    activities: [{
      time: String,
      activity: String,
      location: String,
      notes: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Start date must be in the future'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(date) {
        return date > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [1, 'Must allow at least 1 participant'],
    max: [50, 'Cannot exceed 50 participants']
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  budget: {
    min: {
      type: Number,
      required: true,
      min: [0, 'Minimum budget cannot be negative']
    },
    max: {
      type: Number,
      required: true,
      min: [0, 'Maximum budget cannot be negative']
    }
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'extreme'],
    default: 'moderate'
  },
  tripType: {
    type: String,
    enum: ['adventure', 'cultural', 'relaxation', 'business', 'family', 'solo', 'group'],
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['planning', 'open', 'full', 'ongoing', 'completed', 'cancelled'],
    default: 'planning'
  },
  // Approval workflow
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  requirements: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

// Validate budget range
tripSchema.pre('save', function(next) {
  if (this.budget.max < this.budget.min) {
    return next(new Error('Maximum budget must be greater than or equal to minimum budget'));
  }
  next();
});

// Update participant count
tripSchema.methods.updateParticipantCount = function() {
  this.currentParticipants = this.participants.filter(p => p.status === 'confirmed').length;
  if (this.currentParticipants >= this.maxParticipants) {
    this.status = 'full';
  } else if (this.status === 'full' && this.currentParticipants < this.maxParticipants) {
    this.status = 'open';
  }
};

module.exports = mongoose.model('Trip', tripSchema);