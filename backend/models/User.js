// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  preferences: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['traveler', 'guide', 'admin'],
    default: 'traveler'
  },
  guideStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'suspended'],
    default: 'unverified'
  },
  guideInfo: {
    specializations: [String],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'native']
      }
    }],
    experience: {
      years: Number,
      description: String
    },
    hourlyRate: {
      amount: Number,
      currency: String
    },
    availability: {
      isAvailable: {
        type: Boolean,
        default: true
      },
      schedule: [{
        day: String,
        startTime: String,
        endTime: String
      }]
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    totalBookings: {
      type: Number,
      default: 0
    },
    completedTrips: {
      type: Number,
      default: 0
    }
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  location: {
    type: String,
    default: ''
  },
  travelBuddies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  joinedTrips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
