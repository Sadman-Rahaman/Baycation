// frontend/src/pages/MyTrips.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { tripAPI } from '../services/api';

const MyTrips = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, organized, joined

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadMyTrips();
  }, [isAuthenticated, navigate, activeTab]);

  const loadMyTrips = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await tripAPI.getUserTrips(activeTab);
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Error loading my trips:', error);
      setError('Failed to load your trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to leave this trip?')) {
      return;
    }
    
    try {
      await tripAPI.leaveTrip(tripId);
      await loadMyTrips(); // Reload trips
    } catch (error) {
      console.error('Error leaving trip:', error);
      setError('Failed to leave trip. Please try again.');
    }
  };

  // Delete option removed per requirement; users should only be able to leave joined trips

  if (!isAuthenticated) {
    return null;
  }

  const getTripActions = (trip) => {
    const isOrganizer = user?._id && trip.organizer?._id && user._id === trip.organizer._id;
    return (
      <div className="btn-group">
        <Link 
          to={`/trips/${trip._id}`} 
          className="btn btn-outline btn-small"
        >
          View Details
        </Link>
        {!isOrganizer && (
          <button 
            onClick={() => handleLeaveTrip(trip._id)}
            className="btn btn-secondary btn-small"
          >
            Leave Trip
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>My Trips</h1>
          <p>Manage your travel adventures and group trips</p>
        </div>
        <Link to="/trips/create" className="btn btn-primary">
          Create New Trip
        </Link>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '1rem'
      }}>
        {[
          { key: 'all', label: 'All Trips', desc: 'Both organized and joined' },
          { key: 'organized', label: 'Organized', desc: 'Trips you created' },
          { key: 'joined', label: 'Joined', desc: 'Trips you joined' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'} btn-small`}
            style={{ 
              borderRadius: '20px',
              padding: '0.5rem 1.5rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Loading your trips...
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3>
            {activeTab === 'organized' ? 'No trips organized yet' :
             activeTab === 'joined' ? 'No trips joined yet' :
             'No trips found'}
          </h3>
          <p>
            {activeTab === 'organized' ? 'Create your first trip and start planning amazing adventures!' :
             activeTab === 'joined' ? 'Browse available trips and join your first group adventure!' :
             'Start your travel journey by creating or joining trips.'}
          </p>
          <div className="btn-group" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            <Link to="/trips/create" className="btn btn-primary">
              Create Trip
            </Link>
            <Link to="/trips" className="btn btn-outline">
              Browse Trips
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          {trips.map((trip) => {
            const isOrganizer = trip.organizer._id;
            const userRole = isOrganizer ? 'Organizer' : 'Participant';
            
            return (
              <div key={trip._id} className="trip-card">
                <div className="trip-header">
                  <div>
                    <h3 className="trip-title">{trip.title}</h3>
                    <p className="trip-destination">📍 {trip.destination}</p>
                    <small style={{ 
                      color: isOrganizer ? '#4caf50' : '#2196f3',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase'
                    }}>
                      {userRole}
                    </small>
                  </div>
                  <span className={`trip-status ${trip.status}`}>
                    {trip.status}
                  </span>
                </div>
                
                <div className="trip-description">
                  {trip.description.length > 100 
                    ? `${trip.description.substring(0, 100)}...` 
                    : trip.description}
                </div>
                
                <div className="trip-details">
                  <div className="trip-detail">
                    <strong>Start Date</strong>
                    {new Date(trip.startDate).toLocaleDateString()}
                  </div>
                  <div className="trip-detail">
                    <strong>End Date</strong>
                    {new Date(trip.endDate).toLocaleDateString()}
                  </div>
                  <div className="trip-detail">
                    <strong>Budget</strong>
                    <span className="trip-budget">
                      ${trip.budget.min} - ${trip.budget.max} {trip.budget.currency}
                    </span>
                  </div>
                  <div className="trip-detail">
                    <strong>Participants</strong>
                    {trip.currentParticipants}/{trip.maxParticipants}
                  </div>
                </div>
                
                <div className="trip-participants">
                  <span className="participants-count">
                    👥 {trip.currentParticipants}/{trip.maxParticipants} participants
                  </span>
                  <span className="trip-organizer">
                    Organized by {trip.organizer.name}
                  </span>
                </div>
                
                {trip.tags && trip.tags.length > 0 && (
                  <div className="trip-tags">
                    {trip.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="trip-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {getTripActions(trip)}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ 
        marginTop: '3rem', 
        padding: '2rem', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#2d7d32' }}>Ready for Your Next Adventure?</h3>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Create a new trip or discover exciting adventures created by other travelers.
        </p>
        <div className="btn-group" style={{ justifyContent: 'center' }}>
          <Link to="/trips/create" className="btn btn-primary">
            Create New Trip
          </Link>
          <Link to="/trips" className="btn btn-outline">
            Browse All Trips
          </Link>
          <Link to="/find-buddies" className="btn btn-secondary">
            Find Travel Buddies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyTrips;