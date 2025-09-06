// backend/models/Story.js
const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Story content is required'],
    trim: true,
    maxlength: [2000, 'Story content cannot exceed 2000 characters']
  },
  photos: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: [200, 'Photo caption cannot exceed 200 characters']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    country: String,
    city: String
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  tags: [String],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ 'location.country': 1, 'location.city': 1 });
storySchema.index({ tags: 1 });
storySchema.index({ isPublic: 1, createdAt: -1 });
storySchema.index({ 'likes.user': 1 });

// Virtual for like count
storySchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
storySchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to check if user liked the story
storySchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId);
};

// Method to add like
storySchema.methods.addLike = function(userId) {
  if (!this.isLikedBy(userId)) {
    this.likes.push({ user: userId });
    return true;
  }
  return false;
};

// Method to remove like
storySchema.methods.removeLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId);
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    return true;
  }
  return false;
};

// Method to add comment
storySchema.methods.addComment = function(authorId, content) {
  this.comments.push({
    author: authorId,
    content: content
  });
  return this.comments[this.comments.length - 1];
};

// Method to update comment
storySchema.methods.updateComment = function(commentId, content, userId) {
  const comment = this.comments.id(commentId);
  if (comment && comment.author.toString() === userId) {
    comment.content = content;
    comment.updatedAt = new Date();
    comment.isEdited = true;
    return comment;
  }
  return null;
};

// Method to delete comment
storySchema.methods.deleteComment = function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (comment && (comment.author.toString() === userId || this.author.toString() === userId)) {
    comment.remove();
    return true;
  }
  return false;
};

// Ensure virtual fields are serialized
storySchema.set('toJSON', { virtuals: true });
storySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Story', storySchema);
