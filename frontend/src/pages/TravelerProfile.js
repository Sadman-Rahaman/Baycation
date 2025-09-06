// frontend/src/pages/TravelerProfile.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { travelerAPI, chatAPI } from '../services/api';

const TravelerProfile = () => {
  const { travelerId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [traveler, setTraveler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadTravelerProfile();
  }, [travelerId, isAuthenticated, navigate]);

  const loadTravelerProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await travelerAPI.getTravelerProfile(travelerId);
      setTraveler(response.data.traveler);
      
      // Check if current user is following this traveler
      if (response.data.traveler.followedBy) {
        setIsFollowing(response.data.traveler.followedBy.includes(user?._id));
      }
    } catch (error) {
      console.error('Error loading traveler profile:', error);
      setError('Failed to load traveler profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      setCreatingChat(true);
      // Create or get existing direct chat
      const response = await chatAPI.createDirectChat(travelerId);
      
      if (response.success && response.data.chat) {
        // Navigate to chat page with the chat ID
        navigate(`/chat/${response.data.chat._id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          Loading traveler profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  if (!traveler) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Traveler not found</h3>
          <p>The traveler profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?._id === traveler._id;
  const canChat = !isOwnProfile && isFollowing; // Can chat if following and not own profile

  return (
    <div className="page-container">
      <div className="card">
        <div className="profile-header">
          <h1>{traveler.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <span className={`traveler-role ${traveler.role}`}>
              {traveler.role}
            </span>
            {traveler.location && (
              <span style={{ color: '#666' }}>📍 {traveler.location}</span>
            )}
            {isOwnProfile && (
              <span style={{ 
                background: '#e8f5e8', 
                color: '#2d7d32', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '15px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Your Profile
              </span>
            )}
          </div>
          
          {/* Action Buttons */}
          {!isOwnProfile && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              {canChat ? (
                <button 
                  className="btn btn-primary"
                  onClick={handleStartChat}
                  disabled={creatingChat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  {creatingChat ? 'Starting Chat...' : 'Chat'}
                </button>
              ) : (
                !isFollowing && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    color: '#666',
                    fontSize: '0.875rem'
                  }}>
                    Follow this traveler to start a chat
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h3>Contact Information</h3>
          <div className="profile-field">
            <span><strong>Email:</strong></span>
            <span>{traveler.email}</span>
          </div>
          <div className="profile-field">
            <span><strong>Member Since:</strong></span>
            <span>{new Date(traveler.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="profile-field">
            <span><strong>Travel Buddies:</strong></span>
            <span>{traveler.travelBuddies?.length || 0} connections</span>
          </div>
          <div className="profile-field">
            <span><strong>Followers:</strong></span>
            <span>{traveler.followedBy?.length || 0} followers</span>
          </div>
        </div>

        {traveler.bio && (
          <div className="profile-info">
            <h3>About</h3>
            <p style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
              {traveler.bio}
            </p>
          </div>
        )}

        {traveler.preferences && (
          <div className="profile-info">
            <h3>Travel Preferences</h3>
            <p style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
              {traveler.preferences}
            </p>
          </div>
        )}

        {traveler.joinedTrips && traveler.joinedTrips.length > 0 && (
          <div className="profile-info">
            <h3>Recent Trips</h3>
            <div className="grid grid-2">
              {traveler.joinedTrips.slice(0, 4).map((trip) => (
                <div key={trip._id} style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '5px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d7d32' }}>{trip.title}</h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem' }}>
                    📍 {trip.destination}
                  </p>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.875rem' }}>
                    📅 {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                  <span className={`trip-status ${trip.status}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelerProfile;
