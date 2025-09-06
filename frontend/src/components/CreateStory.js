// frontend/src/components/CreateStory.js
import React, { useState } from 'react';
import { storyAPI } from '../services/api';

const MAX_PHOTOS = 5;
const MAX_CONTENT_LENGTH = 1000;

const CreateStory = ({ onClose, onStoryCreated }) => {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [photos, setPhotos] = useState([{ url: '', caption: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (index, field, value) => {
    const newPhotos = [...photos];
    newPhotos[index][field] = value;
    setPhotos(newPhotos);
  };

  const addPhoto = () => {
    if (photos.length < MAX_PHOTOS) {
      setPhotos([...photos, { url: '', caption: '' }]);
    }
  };

  const removePhoto = (index) => {
    if (photos.length > 1) {
      setPhotos(photos.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Story content cannot be empty.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // Filter out empty photos
      const validPhotos = photos.filter(photo => photo.url.trim());
      
      // Parse tags
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      // Parse location - for now we'll create a simple location object
      const locationObj = location.trim() ? { name: location.trim() } : null;
      
      const storyData = {
        content: content.trim(),
        photos: validPhotos,
        location: locationObj,
        tags: tagArray,
        isPublic: true // You can add a toggle for this later
      };

      await storyAPI.createStory(storyData);
      
      // Reset form
      setContent('');
      setLocation('');
      setTags('');
      setPhotos([{ url: '', caption: '' }]);
      
      // Call the callback to refresh stories and close modal
      onStoryCreated();
      
    } catch (error) {
      console.error('Error creating story:', error);
      setError(error.response?.data?.message || 'Failed to create story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-story-modal-container">
      <form className="create-story-form" onSubmit={handleSubmit} noValidate>
        {/* Fixed Header */}
        <div className="form-header">
          <h2 id="create-story-title">Share Your Travel Story</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="form-content">
          {/* Story Content */}
          <div className="form-group">
            <label htmlFor="story-content">Your Story <span aria-hidden="true">*</span></label>
            <textarea
              id="story-content"
              name="content"
              rows="5"
              maxLength={MAX_CONTENT_LENGTH}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write about your travel adventures, tips, or memorable moments..."
              required
              aria-describedby="content-help"
              aria-required="true"
            />
            <small id="content-help" className="char-count" aria-live="polite">
              {content.length} / {MAX_CONTENT_LENGTH} characters
            </small>
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="story-location">Location</label>
            <input
              type="text"
              id="story-location"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where did this happen? (e.g., Paris, Bali)"
              autoComplete="off"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="story-tags">Tags (comma separated)</label>
            <input
              type="text"
              id="story-tags"
              name="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="adventure, culture, food"
              autoComplete="off"
            />
          </div>

          {/* Photos */}
          <fieldset className="form-photos" aria-describedby="photos-desc">
            <legend>Photos (optional)</legend>
            <p id="photos-desc" className="photos-description">
              Add up to {MAX_PHOTOS} photos with optional captions.
            </p>

            {photos.map((photo, idx) => (
              <div key={idx} className="photo-item">
                <input
                  type="url"
                  name={`photo-url-${idx}`}
                  value={photo.url}
                  onChange={(e) => handlePhotoChange(idx, 'url', e.target.value)}
                  placeholder="Photo URL"
                  aria-label={`Photo URL ${idx + 1}`}
                />
                <input
                  type="text"
                  name={`photo-caption-${idx}`}
                  value={photo.caption}
                  onChange={(e) => handlePhotoChange(idx, 'caption', e.target.value)}
                  placeholder="Caption"
                  aria-label={`Caption for photo ${idx + 1}`}
                  maxLength={100}
                />
                {photos.length > 1 && (
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={() => removePhoto(idx)}
                    aria-label={`Remove photo ${idx + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                className="add-photo-btn"
                onClick={addPhoto}
                aria-label="Add another photo"
              >
                + Add Photo
              </button>
            )}
          </fieldset>

          {/* Error Message */}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="form-footer">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            aria-disabled={loading}
          >
            {loading ? 'Sharing...' : 'Share Story'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
            aria-disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>

      <style jsx>{`
        .create-story-modal-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 9999;
          overflow-y: auto;
        }

        .create-story-form {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        /* Fixed Header */
        .form-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border-radius: 12px 12px 0 0;
        }

        .form-header h2 {
          margin: 0;
          color: #2d7d32;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          line-height: 1;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f5f5f5;
          color: #333;
        }

        /* Scrollable Content */
        .form-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 2rem;
          max-height: calc(90vh - 140px - 80px); /* Subtract header and footer heights */
        }

        /* Custom Scrollbar */
        .form-content::-webkit-scrollbar {
          width: 8px;
        }

        .form-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .form-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .form-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Fixed Footer */
        .form-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: center;
          gap: 1rem;
          background: white;
          border-radius: 0 0 12px 12px;
        }

        .form-group {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
          color: #333;
        }

        textarea,
        input[type="text"],
        input[type="url"] {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.25s ease;
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        textarea:focus,
        input[type="text"]:focus,
        input[type="url"]:focus {
          border-color: #2d7d32;
          outline: none;
          box-shadow: 0 0 0 3px rgba(45, 125, 50, 0.1);
        }

        .char-count {
          margin-top: 0.25rem;
          font-size: 0.85rem;
          color: #666;
          text-align: right;
        }

        .form-photos {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-photos legend {
          font-weight: 600;
          font-size: 0.95rem;
          color: #333;
          padding: 0 0.5rem;
        }

        .photos-description {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 1rem;
        }

        .photo-item {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          align-items: center;
        }

        .photo-item input[type='url'] {
          flex: 2;
        }

        .photo-item input[type='text'] {
          flex: 1.5;
        }

        .remove-photo-btn {
          background: #f44336;
          border: none;
          color: white;
          font-weight: bold;
          font-size: 1.25rem;
          line-height: 1;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          transition: background-color 0.25s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }

        .remove-photo-btn:hover {
          background: #d32f2f;
        }

        .add-photo-btn {
          background: #2d7d32;
          color: white;
          border-radius: 20px;
          border: none;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: inline-block;
        }

        .add-photo-btn:hover {
          background-color: #1b5e20;
        }

        .form-error {
          background-color: #ffebee;
          border: 1px solid #f44336;
          color: #c62828;
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .btn {
          padding: 0.75rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .btn-primary {
          background-color: #2d7d32;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #1b5e20;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(45, 125, 50, 0.3);
        }

        .btn-primary:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-outline {
          background-color: transparent;
          color: #2d7d32;
          border: 2px solid #2d7d32;
        }

        .btn-outline:hover:not(:disabled) {
          background-color: #2d7d32;
          color: white;
        }

        .btn-outline:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .create-story-modal-container {
            padding: 0;
          }

          .create-story-form {
            max-height: 100vh;
            height: 100vh;
            max-width: 100%;
            border-radius: 0;
          }

          .form-header {
            border-radius: 0;
            padding: 1rem 1.5rem;
          }

          .form-content {
            padding: 1rem 1.5rem;
            max-height: calc(100vh - 120px - 70px);
          }

          .form-footer {
            padding: 1rem 1.5rem;
            border-radius: 0;
          }

          .photo-item {
            flex-direction: column;
            align-items: stretch;
          }

          .photo-item input[type='url'],
          .photo-item input[type='text'] {
            flex: none;
            width: 100%;
          }

          .remove-photo-btn {
            align-self: flex-end;
            margin-top: 0.5rem;
          }

          .form-footer {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateStory;
