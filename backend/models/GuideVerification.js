// backend/models/GuideVerification.js
const mongoose = require('mongoose');

const guideVerificationSchema = new mongoose.Schema({
  verification_id: {
    type: String,
    required: true,
    unique: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  personalInfo: {
    fullName: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    nationality: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  professionalInfo: {
    experience: {
      years: {
        type: Number,
        required: true,
        min: 0
      },
      description: {
        type: String,
        required: true,
        maxlength: [1000, 'Experience description cannot exceed 1000 characters']
      }
    },
    specializations: [{
      type: String,
      enum: ['adventure', 'cultural', 'historical', 'nature', 'culinary', 'photography', 'language', 'other']
    }],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'native']
      }
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      certificateNumber: String
    }],
    previousEmployers: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      description: String
    }]
  },
  documents: {
    idDocument: {
      type: String, // File path or URL
      required: true
    },
    idDocumentType: {
      type: String,
      enum: ['passport', 'drivers_license', 'national_id'],
      required: true
    },
    profilePhoto: {
      type: String, // File path or URL
      required: true
    },
    additionalDocuments: [{
      name: String,
      type: String,
      url: String,
      description: String
    }]
  },
  references: [{
    name: String,
    email: String,
    phone: String,
    relationship: String,
    company: String,
    position: String
  }],
  review: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    comments: String,
    rejectionReason: String,
    requirements: [String] // Additional requirements if any
  },
  verificationLevel: {
    type: String,
    enum: ['basic', 'verified', 'premium'],
    default: 'basic'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure one verification per user
guideVerificationSchema.index({ applicant: 1 }, { unique: true });

module.exports = mongoose.model('GuideVerification', guideVerificationSchema);
