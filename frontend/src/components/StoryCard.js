// frontend/src/components/StoryCard.js
import React, { useState } from 'react';
import { storyAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';

const StoryCard = ({ story, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isLiked = story.likes ? story.likes.some(like => like.user === user._id) : false;

  const handleLike = async () => {
    try {
      setLoading(true);
      await storyAPI.toggleLike(story._id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      await storyAPI.addComment(story._id, { content: newComment.trim() });
      setNewComment('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="story-card">
      {/* Minimal Header */}
      <div className="story-header">
        <div className="author-section">
          <div className="author-avatar">
            <span>{story.author.name.charAt(0)}</span>
          </div>
          <div className="author-details">
            <span className="author-name">{story.author.name}</span>
            <span className="story-meta">
              {formatDate(story.createdAt)}
              {story.location && ` • ${story.location.name}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="story-body">
        <p className="story-text">{story.content}</p>
        
        {/* Photos Grid */}
        {story.photos && story.photos.length > 0 && (
          <div className={`photo-grid photo-count-${Math.min(story.photos.length, 4)}`}>
            {story.photos.slice(0, 4).map((photo, index) => (
              <div key={index} className="photo-wrapper">
                <img src={photo.url} alt={photo.caption || ''} />
                {story.photos.length > 4 && index === 3 && (
                  <div className="more-photos">+{story.photos.length - 4}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Minimal Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="story-tags">
            {story.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag-pill">#{tag}</span>
            ))}
            {story.tags.length > 3 && (
              <span className="tag-more">+{story.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="story-actions">
        <div className="action-stats">
          <button 
            className={`action-item ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
            disabled={loading}
          >
            <span className="action-icon">
              {isLiked ? '❤️' : '🤍'}
            </span>
            <span className="action-count">
              {story.likeCount || story.likes?.length || 0}
            </span>
          </button>
          
          <button 
            className={`action-item ${showComments ? 'active' : ''}`}
            onClick={() => setShowComments(!showComments)}
          >
            <span className="action-icon">💬</span>
            <span className="action-count">
              {story.commentCount || story.comments?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Comments */}
      <div className={`comments-container ${showComments ? 'expanded' : ''}`}>
        {showComments && (
          <>
            <div className="comments-list">
              {story.comments && story.comments.length > 0 ? (
                <>
                  {story.comments.slice(-3).map((comment) => (
                    <div key={comment._id} className="comment-item">
                      <div className="comment-avatar">
                        {comment.author.name.charAt(0)}
                      </div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">{comment.author.name}</span>
                          <span className="comment-time">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="comment-text">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {story.comments.length > 3 && (
                    <button className="show-more-comments">
                      Show all {story.comments.length} comments
                    </button>
                  )}
                </>
              ) : (
                <div className="no-comments">
                  <span>Be the first to comment</span>
                </div>
              )}
            </div>

            <form className="comment-input-wrapper" onSubmit={handleAddComment}>
              <input
                type="text"
                className="comment-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength="300"
              />
              <button 
                type="submit" 
                className="comment-submit"
                disabled={!newComment.trim() || loading}
              >
                <span>→</span>
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .story-card {
          background: white;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }

        .story-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        /* Header */
        .story-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .author-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .author-details {
          display: flex;
          flex-direction: column;
        }

        .author-name {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 15px;
        }

        .story-meta {
          font-size: 13px;
          color: #8e8e8e;
        }

        /* Body */
        .story-body {
          padding: 1.25rem;
        }

        .story-text {
          color: #2d2d2d;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        /* Photo Grid */
        .photo-grid {
          display: grid;
          gap: 4px;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .photo-grid.photo-count-1 {
          grid-template-columns: 1fr;
        }

        .photo-grid.photo-count-2 {
          grid-template-columns: 1fr 1fr;
        }

        .photo-grid.photo-count-3 {
          grid-template-columns: 2fr 1fr;
        }

        .photo-grid.photo-count-3 .photo-wrapper:first-child {
          grid-row: span 2;
        }

        .photo-grid.photo-count-4 {
          grid-template-columns: 1fr 1fr;
        }

        .photo-wrapper {
          position: relative;
          padding-bottom: 100%;
          background: #f5f5f5;
        }

        .photo-wrapper img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .more-photos {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
        }

        /* Tags */
        .story-tags {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .tag-pill {
          background: #f0f4ff;
          color: #4a5fc1;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .tag-more {
          color: #8e8e8e;
          font-size: 13px;
        }

        /* Actions */
        .story-actions {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid #f0f0f0;
          background: #fafbfc;
        }

        .action-stats {
          display: flex;
          gap: 1.5rem;
        }

        .action-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 8px;
        }

        .action-item:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .action-item.active {
          background: rgba(103, 126, 234, 0.1);
        }

        .action-icon {
          font-size: 20px;
          transition: transform 0.2s;
        }

        .action-item:active .action-icon {
          transform: scale(1.2);
        }

        .action-count {
          font-size: 14px;
          font-weight: 600;
          color: #2d2d2d;
        }

        /* Comments */
        .comments-container {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
          background: #f8f9fa;
        }

        .comments-container.expanded {
          max-height: 500px;
          border-top: 1px solid #e0e0e0;
        }

        .comments-list {
          padding: 1rem 1.25rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .comment-item {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: #2d7d32;
          flex-shrink: 0;
        }

        .comment-body {
          flex: 1;
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }

        .comment-author {
          font-weight: 600;
          font-size: 14px;
          color: #1a1a1a;
        }

        .comment-time {
          font-size: 12px;
          color: #8e8e8e;
        }

        .comment-text {
          font-size: 14px;
          color: #2d2d2d;
          line-height: 1.4;
        }

        .show-more-comments {
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem 0;
        }

        .show-more-comments:hover {
          text-decoration: underline;
        }

        .no-comments {
          text-align: center;
          padding: 2rem;
          color: #8e8e8e;
          font-size: 14px;
        }

        .comment-input-wrapper {
          display: flex;
          padding: 1rem 1.25rem;
          gap: 0.75rem;
          border-top: 1px solid #e0e0e0;
          background: white;
        }

        .comment-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .comment-input:focus {
          border-color: #667eea;
        }

        .comment-submit {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .comment-submit:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .comment-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Scrollbar */
        .comments-list::-webkit-scrollbar {
          width: 6px;
        }

        .comments-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .comments-list::-webkit-scrollbar-thumb {
          background: #d0d0d0;
          border-radius: 3px;
        }

        @media (max-width: 640px) {
          .story-card {
            border-radius: 0;
            margin-bottom: 0.5rem;
          }

          .story-body {
            padding: 1rem;
          }

          .story-header {
            padding: 1rem;
          }

          .comments-container.expanded {
            max-height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default StoryCard;
