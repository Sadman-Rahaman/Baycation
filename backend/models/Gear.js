// backend/models/Gear.js
const mongoose = require('mongoose');

const gearSchema = new mongoose.Schema({
  gear_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Gear name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['clothing', 'equipment', 'electronics', 'accessories', 'safety', 'other']
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: true
  },
  size: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'g', 'oz'],
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in', 'm', 'ft'],
      default: 'cm'
    }
  },
  price: {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'BDT',
      enum: ['USD', 'EUR', 'GBP', 'BDT', 'INR']
    },
    type: {
      type: String,
      enum: ['rent', 'sale'],
      required: true
    }
  },
  rentalPeriod: {
    minDays: {
      type: Number,
      default: 1,
      min: 1
    },
    maxDays: {
      type: Number,
      default: 30,
      min: 1
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableFrom: {
      type: Date,
      default: Date.now
    },
    availableUntil: {
      type: Date
    }
  },
  location: {
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    pickupAddress: String
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  features: [String],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true  // Set to true by default
  },
  isApproved: {
    type: Boolean,
    default: true  // Set to true by default - no admin approval required
  },
  approvedAt: {
    type: Date,
    default: Date.now  // Add default
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  wishlistCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add text index for search
gearSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

// Add compound indexes for filtering
gearSchema.index({ category: 1, subcategory: 1 });
gearSchema.index({ 'price.type': 1, 'price.amount': 1 });
gearSchema.index({ 'location.city': 1, 'location.country': 1 });
gearSchema.index({ seller: 1, isActive: 1 });
gearSchema.index({ isActive: 1, isApproved: 1 }); // Add this index for faster queries

module.exports = mongoose.model('Gear', gearSchema);
