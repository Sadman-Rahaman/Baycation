// backend/controllers/storyController.js
const Story = require('../models/Story');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class StoryController {
  // Create a new story
  static async createStory(req, res) {
    try {
      const {
        content,
        photos,
        location,
        trip,
        tags,
        isPublic
      } = req.body;

      const story = new Story({
        author: req.user.userId,
        content,
        photos: photos || [],
        location,
        trip,
        tags: tags || [],
        isPublic: isPublic !== undefined ? isPublic : true
      });

      await story.save();
      await story.populate('author', 'name email bio location');

      res.status(201).json({
        success: true,
        message: 'Story created successfully',
        data: { story }
      });
    } catch (error) {
      console.error('Create story error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating story'
      });
    }
  }

  // Get all public stories (feed)
  static async getStoriesFeed(req, res) {
    try {
      const { page = 1, limit = 10, location, tags } = req.query;
      const skip = (page - 1) * limit;

      let query = { isPublic: true, isArchived: false };

      // Filter by location
      if (location) {
        query['location.country'] = new RegExp(location, 'i');
      }

      // Filter by tags
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query.tags = { $in: tagArray };
      }

      const stories = await Story.find(query)
        .populate('author', 'name email bio location')
        .populate('trip', 'title destination')
        .populate('likes.user', 'name')
        .populate('comments.author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Story.countDocuments(query);

      res.json({
        success: true,
        data: {
          stories,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalStories: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get stories feed error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching stories'
      });
    }
  }

  // Get stories from followed users
  static async getFollowingFeed(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      // Get user's travel buddies (followed users)
      const user = await User.findById(userId).select('travelBuddies');
      const followingIds = user.travelBuddies || [];

      // Include user's own stories
      followingIds.push(userId);

      const stories = await Story.find({
        author: { $in: followingIds },
        isPublic: true,
        isArchived: false
      })
        .populate('author', 'name email bio location')
        .populate('trip', 'title destination')
        .populate('likes.user', 'name')
        .populate('comments.author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Story.countDocuments({
        author: { $in: followingIds },
        isPublic: true,
        isArchived: false
      });

      res.json({
        success: true,
        data: {
          stories,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalStories: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get following feed error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching following feed'
      });
    }
  }

  // Get user's own stories
  static async getUserStories(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const query = { author: userId, isArchived: false };
      
      // If viewing own profile, show all stories (including private)
      if (userId === req.user.userId) {
        delete query.isPublic;
      } else {
        query.isPublic = true;
      }

      const stories = await Story.find(query)
        .populate('author', 'name email bio location')
        .populate('trip', 'title destination')
        .populate('likes.user', 'name')
        .populate('comments.author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Story.countDocuments(query);

      res.json({
        success: true,
        data: {
          stories,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalStories: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get user stories error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching user stories'
      });
    }
  }

  // Get single story
  static async getStory(req, res) {
    try {
      const { storyId } = req.params;

      const story = await Story.findById(storyId)
        .populate('author', 'name email bio location')
        .populate('trip', 'title destination')
        .populate('likes.user', 'name')
        .populate('comments.author', 'name email');

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      // Check if user can view the story
      if (!story.isPublic && story.author._id.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'This story is private'
        });
      }

      // Increment view count
      story.views += 1;
      await story.save();

      res.json({
        success: true,
        data: { story }
      });
    } catch (error) {
      console.error('Get story error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching story'
      });
    }
  }

  // Update story
  static async updateStory(req, res) {
    try {
      const { storyId } = req.params;
      const { content, photos, location, tags, isPublic } = req.body;

      const story = await Story.findById(storyId);

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      // Check if user owns the story
      if (story.author.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own stories'
        });
      }

      // Update fields
      if (content !== undefined) story.content = content;
      if (photos !== undefined) story.photos = photos;
      if (location !== undefined) story.location = location;
      if (tags !== undefined) story.tags = tags;
      if (isPublic !== undefined) story.isPublic = isPublic;

      await story.save();
      await story.populate('author', 'name email bio location');

      res.json({
        success: true,
        message: 'Story updated successfully',
        data: { story }
      });
    } catch (error) {
      console.error('Update story error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating story'
      });
    }
  }

  // Delete story
  static async deleteStory(req, res) {
    try {
      const { storyId } = req.params;

      const story = await Story.findById(storyId);

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      // Check if user owns the story
      if (story.author.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own stories'
        });
      }

      await Story.findByIdAndDelete(storyId);

      res.json({
        success: true,
        message: 'Story deleted successfully'
      });
    } catch (error) {
      console.error('Delete story error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting story'
      });
    }
  }

  // Like/Unlike story
  static async toggleLike(req, res) {
    try {
      const { storyId } = req.params;
      const userId = req.user.userId;

      const story = await Story.findById(storyId);

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      const isLiked = story.isLikedBy(userId);
      let action;

      if (isLiked) {
        story.removeLike(userId);
        action = 'unliked';
      } else {
        story.addLike(userId);
        action = 'liked';
      }

      await story.save();

      res.json({
        success: true,
        message: `Story ${action} successfully`,
        data: {
          isLiked: !isLiked,
          likeCount: story.likeCount
        }
      });
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while toggling like'
      });
    }
  }

  // Add comment to story
  static async addComment(req, res) {
    try {
      const { storyId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      const story = await Story.findById(storyId);

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      const comment = story.addComment(req.user.userId, content.trim());
      await story.save();

      // Populate the new comment
      await story.populate('comments.author', 'name email');

      const newComment = story.comments.id(comment._id);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment: newComment }
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while adding comment'
      });
    }
  }

  // Update comment
  static async updateComment(req, res) {
    try {
      const { storyId, commentId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      const story = await Story.findById(storyId);

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      const comment = story.updateComment(commentId, content.trim(), req.user.userId);

      if (!comment) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own comments'
        });
      }

      await story.save();
      await story.populate('comments.author', 'name email');

      const updatedComment = story.comments.id(commentId);

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment: updatedComment }
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating comment'
      });
    }
  }

  // Delete comment
  static async deleteComment(req, res) {
    try {
      const { storyId, commentId } = req.params;

      const story = await Story.findById(storyId);

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      const deleted = story.deleteComment(commentId, req.user.userId);

      if (!deleted) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own comments or story owner can delete any comment'
        });
      }

      await story.save();

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting comment'
      });
    }
  }

  // Archive story
  static async archiveStory(req, res) {
    try {
      const { storyId } = req.params;

      const story = await Story.findById(storyId);

      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }

      // Check if user owns the story
      if (story.author.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only archive your own stories'
        });
      }

      story.isArchived = true;
      await story.save();

      res.json({
        success: true,
        message: 'Story archived successfully'
      });
    } catch (error) {
      console.error('Archive story error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while archiving story'
      });
    }
  }
}

module.exports = StoryController;
