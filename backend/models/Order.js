// backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    gear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gear',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      amount: Number,
      currency: String
    },
    rentalPeriod: {
      startDate: Date,
      endDate: Date,
      days: Number
    }
  }],
  totalAmount: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash'],
    required: true
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String
  },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
    instructions: String
  },
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'delivery', 'shipping'],
    required: true
  },
  trackingNumber: String,
  notes: String,
  cancellationReason: String,
  refundAmount: {
    amount: Number,
    currency: String,
    reason: String,
    processedAt: Date
  },
  deliveryDate: Date,
  returnDate: Date,
  isReturned: {
    type: Boolean,
    default: false
  },
  returnCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
  },
  returnNotes: String
}, {
  timestamps: true
});

// Add indexes for efficient queries
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ order_id: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
