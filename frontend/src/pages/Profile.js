// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { userAPI, storyAPI } from '../services/api';
import CreateStory from '../components/CreateStory';
import StoryCard from '../components/StoryCard';

const Profile = () => {
  const { user, updateUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Add missing state variables
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'stories'
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [userStories, setUserStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    preferences: '',
    bio: '',
    location: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user) {
      setFormData({
        name: user.name || '',
        preferences: user.preferences || '',
        bio: user.bio || '',
        location: user.location || ''
      });
    }
  }, [isAuthenticated, user, navigate]);

  // Load user stories when stories tab is active
  useEffect(() => {
    if (activeTab === 'stories' && user) {
      loadUserStories();
    }
  }, [activeTab, user]);

  const loadUserStories = async () => {
    try {
      setStoriesLoading(true);
      const response = await storyAPI.getUserStories(user._id);
      setUserStories(response.data.stories);
    } catch (error) {
      console.error('Error loading user stories:', error);
    } finally {
      setStoriesLoading(false);
    }
  };

  const handleStoryCreated = () => {
    setShowCreateStory(false);
    if (activeTab === 'stories') {
      loadUserStories();
    }
  };

  const handleStoryUpdate = () => {
    if (activeTab === 'stories') {
      loadUserStories();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await userAPI.updateProfile(formData);
      updateUser(response.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    }
    
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    
    try {
      await userAPI.deleteAccount();
      logout();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete account' 
      });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      preferences: user.preferences || '',
      bio: user.bio || '',
      location: user.location || ''
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account information and travel preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            My Stories
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'stories' ? (
          <div className="stories-section">
            <div className="stories-header">
              <h2>My Travel Stories</h2>
              <button 
                className="btn-primary"
                onClick={() => setShowCreateStory(true)}
              >
                Share New Story
              </button>
            </div>

            {storiesLoading ? (
              <div className="loading">Loading your stories...</div>
            ) : (
              <div className="user-stories">
                {userStories.length === 0 ? (
                  <div className="no-stories">
                    <h3>No stories yet</h3>
                    <p>Share your first travel story to inspire others!</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowCreateStory(true)}
                    >
                      Share Your First Story
                    </button>
                  </div>
                ) : (
                  userStories.map((story) => (
                    <StoryCard
                      key={story._id}
                      story={story}
                      onUpdate={handleStoryUpdate}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {!isEditing ? (
              <>
                <div className="profile-info">
                  <h3>Account Information</h3>
                  <div className="profile-field">
                    <span><strong>Name:</strong></span>
                    <span>{user.name}</span>
                  </div>
                  <div className="profile-field">
                    <span><strong>Email:</strong></span>
                    <span>{user.email}</span>
                  </div>
                  <div className="profile-field">
                    <span><strong>Role:</strong></span>
                    <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                  </div>
                  <div className="profile-field">
                    <span><strong>Location:</strong></span>
                    <span>{user.location || 'Not specified'}</span>
                  </div>
                  <div className="profile-field">
                    <span><strong>Member Since:</strong></span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="profile-field">
                    <span><strong>Travel Buddies:</strong></span>
                    <span>{user.travelBuddies?.length || 0} connections</span>
                  </div>
                </div>

                <div className="profile-info">
                  <h3>Bio</h3>
                  <p style={{ 
                    minHeight: '60px', 
                    padding: '1rem', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '5px',
                    fontStyle: user.bio ? 'normal' : 'italic',
                    color: user.bio ? '#333' : '#666'
                  }}>
                    {user.bio || 'No bio added yet. Click edit to tell others about yourself!'}
                  </p>
                </div>

                <div className="profile-info">
                  <h3>Travel Preferences</h3>
                  <p style={{ 
                    minHeight: '60px', 
                    padding: '1rem', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '5px',
                    fontStyle: user.preferences ? 'normal' : 'italic',
                    color: user.preferences ? '#333' : '#666'
                  }}>
                    {user.preferences || 'No travel preferences set yet. Click edit to add your travel interests!'}
                  </p>
                </div>

                <div className="btn-group">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location" className="form-label">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="City, Country"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio" className="form-label">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Tell others about yourself, your travel experience, interests..."
                    disabled={loading}
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="preferences" className="form-label">Travel Preferences</label>
                  <textarea
                    id="preferences"
                    name="preferences"
                    value={formData.preferences}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Share your travel interests, preferred destinations, activities you enjoy..."
                    disabled={loading}
                  />
                </div>

                <div className="btn-group">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {showCreateStory && (
        <div className="modal-overlay">
          <CreateStory
            onStoryCreated={handleStoryCreated}
            onClose={() => setShowCreateStory(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Profile;