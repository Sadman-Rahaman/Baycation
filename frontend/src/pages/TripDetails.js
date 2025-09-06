// frontend/src/pages/TripDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { tripAPI } from '../services/api';

const TripDetails = () => {
  const { tripId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingItinerary, setEditingItinerary] = useState(false);
  const [itinerary, setItinerary] = useState([]);

  useEffect(() => {
    loadTripDetails();
  }, [tripId]);

  const loadTripDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await tripAPI.getTrip(tripId);
      setTrip(response.data.trip);
      setItinerary(response.data.trip.itinerary || []);
    } catch (error) {
      console.error('Error loading trip details:', error);
      setError('Failed to load trip details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTrip = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setActionLoading(true);
      await tripAPI.joinTrip(tripId);
      await loadTripDetails(); // Reload to update participant count
    } catch (error) {
      console.error('Error joining trip:', error);
      setError(error.response?.data?.message || 'Failed to join trip. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTrip = async () => {
    if (!window.confirm('Are you sure you want to leave this trip?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await tripAPI.leaveTrip(tripId);
      await loadTripDetails(); // Reload to update participant count
    } catch (error) {
      console.error('Error leaving trip:', error);
      setError(error.response?.data?.message || 'Failed to leave trip. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await tripAPI.deleteTrip(tripId);
      navigate('/my-trips');
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError(error.response?.data?.message || 'Failed to delete trip. Please try again.');
      setActionLoading(false);
    }
  };

  const addItineraryDay = () => {
    const newDay = {
      day: itinerary.length + 1,
      activities: []
    };
    setItinerary([...itinerary, newDay]);
  };

  const addActivity = (dayIndex) => {
    const newActivity = {
      time: '',
      activity: '',
      location: '',
      notes: ''
    };
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].activities.push(newActivity);
    setItinerary(updatedItinerary);
  };

  const updateActivity = (dayIndex, activityIndex, field, value) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].activities[activityIndex][field] = value;
    setItinerary(updatedItinerary);
  };

  const removeActivity = (dayIndex, activityIndex) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].activities.splice(activityIndex, 1);
    setItinerary(updatedItinerary);
  };

  const saveItinerary = async () => {
    try {
      setActionLoading(true);
      await tripAPI.updateItinerary(tripId, itinerary);
      setEditingItinerary(false);
      await loadTripDetails();
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setError('Failed to save itinerary. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          Loading trip details...
        </div>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Trip not found</h3>
          <p>The trip you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const isOrganizer = isAuthenticated && user?._id === trip.organizer._id;
  const isParticipant = isAuthenticated && trip.participants.some(p => p.user._id === user?._id);
  const canJoin = isAuthenticated && !isOrganizer && !isParticipant && trip.currentParticipants < trip.maxParticipants;
  const canEditItinerary = isAuthenticated && (isOrganizer || isParticipant);

  return (
    <div className="page-container">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card">
        <div className="trip-header">
          <div>
            <h1>{trip.title}</h1>
            <p style={{ fontSize: '1.1rem', color: '#666', marginTop: '0.5rem' }}>
              📍 {trip.destination}
            </p>
          </div>
          <span className={`trip-status ${trip.status}`}>
            {trip.status}
          </span>
        </div>

        <div className="trip-description" style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          {trip.description}
        </div>

        <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
          <div className="profile-info">
            <h3>Trip Details</h3>
            <div className="profile-field">
              <span><strong>Start Date:</strong></span>
              <span>{new Date(trip.startDate).toLocaleDateString()}</span>
            </div>
            <div className="profile-field">
              <span><strong>End Date:</strong></span>
              <span>{new Date(trip.endDate).toLocaleDateString()}</span>
            </div>
            <div className="profile-field">
              <span><strong>Duration:</strong></span>
              <span>{Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))} days</span>
            </div>
            <div className="profile-field">
              <span><strong>Trip Type:</strong></span>
              <span style={{ textTransform: 'capitalize' }}>{trip.tripType}</span>
            </div>
            <div className="profile-field">
              <span><strong>Difficulty:</strong></span>
              <span style={{ textTransform: 'capitalize' }}>{trip.difficulty}</span>
            </div>
            <div className="profile-field">
              <span><strong>Budget:</strong></span>
              <span className="trip-budget">
                ${trip.budget.min} - ${trip.budget.max} {trip.budget.currency}
              </span>
            </div>
          </div>

          <div className="profile-info">
            <h3>Organizer & Participants</h3>
            <div className="profile-field">
              <span><strong>Organized by:</strong></span>
              <Link 
                to={`/traveler/${trip.organizer._id}`}
                style={{ color: '#4caf50', textDecoration: 'none' }}
              >
                {trip.organizer.name}
              </Link>
            </div>
            <div className="profile-field">
              <span><strong>Participants:</strong></span>
              <span>{trip.currentParticipants} / {trip.maxParticipants}</span>
            </div>
            <div className="profile-field">
              <span><strong>Available Spots:</strong></span>
              <span>{trip.maxParticipants - trip.currentParticipants}</span>
            </div>
            {trip.participants && trip.participants.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Current Participants:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {trip.participants.filter(p => p.status === 'confirmed').map((participant) => (
                    <Link
                      key={participant.user._id}
                      to={`/traveler/${participant.user._id}`}
                      style={{ 
                        display: 'block', 
                        color: '#4caf50', 
                        textDecoration: 'none',
                        padding: '0.25rem 0'
                      }}
                    >
                      {participant.user.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {trip.tags && trip.tags.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3>Tags</h3>
            <div className="trip-tags">
              {trip.tags.map((tag, index) => (
                <span key={index} className="trip-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {trip.requirements && trip.requirements.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3>Requirements</h3>
            <ul style={{ paddingLeft: '2rem', lineHeight: '1.6' }}>
              {trip.requirements.map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="btn-group" style={{ marginBottom: '2rem' }}>
          {canJoin && (
            <button 
              onClick={handleJoinTrip}
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Joining...' : 'Join This Trip'}
            </button>
          )}
          
          {(isOrganizer || isParticipant) && trip.collaborativeFeatures.allowDiscussions && (
            <Link 
              to={`/trips/${tripId}/collaborate`}
              className="btn btn-outline"
            >
              💬 Collaborate & Chat
            </Link>
          )}
          
          {isParticipant && !isOrganizer && (
            <button 
              onClick={handleLeaveTrip}
              className="btn btn-secondary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Leaving...' : 'Leave Trip'}
            </button>
          )}
          
          {isOrganizer && (
            <>
              <Link 
                to={`/trips/${tripId}/edit`}
                className="btn btn-outline"
              >
                Edit Trip
              </Link>
              <button 
                onClick={handleDeleteTrip}
                className="btn btn-danger"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Trip'}
              </button>
            </>
          )}

          {!isAuthenticated && (
            <Link to="/login" className="btn btn-primary">
              Login to Join Trip
            </Link>
          )}
        </div>
      </div>

      {/* Itinerary Section */}
      {canEditItinerary && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>Trip Itinerary</h2>
            {!editingItinerary ? (
              <button 
                onClick={() => setEditingItinerary(true)}
                className="btn btn-outline btn-small"
              >
                {itinerary.length === 0 ? 'Create Itinerary' : 'Edit Itinerary'}
              </button>
            ) : (
              <div className="btn-group">
                <button 
                  onClick={saveItinerary}
                  className="btn btn-primary btn-small"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={() => {
                    setEditingItinerary(false);
                    setItinerary(trip.itinerary || []);
                  }}
                  className="btn btn-secondary btn-small"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {itinerary.length === 0 && !editingItinerary ? (
            <div className="empty-state">
              <h3>No itinerary created yet</h3>
              <p>Create a detailed day-by-day plan for this trip.</p>
            </div>
          ) : (
            <div className="itinerary-section">
              {itinerary.map((day, dayIndex) => (
                <div key={dayIndex} className="itinerary-day">
                  <div className="itinerary-day-header">
                    <span className="day-number">Day {day.day}</span>
                    {editingItinerary && (
                      <button
                        onClick={() => addActivity(dayIndex)}
                        className="btn btn-outline btn-small"
                      >
                        Add Activity
                      </button>
                    )}
                  </div>

                  {day.activities.map((activity, activityIndex) => (
                    <div key={activityIndex} className="activity-item">
                      {editingItinerary ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <input
                              type="text"
                              value={activity.time}
                              onChange={(e) => updateActivity(dayIndex, activityIndex, 'time', e.target.value)}
                              className="form-input"
                              placeholder="Time (e.g., 9:00 AM)"
                              style={{ width: '150px' }}
                            />
                            <button
                              onClick={() => removeActivity(dayIndex, activityIndex)}
                              className="btn btn-danger btn-small"
                              style={{ marginLeft: '1rem' }}
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            type="text"
                            value={activity.activity}
                            onChange={(e) => updateActivity(dayIndex, activityIndex, 'activity', e.target.value)}
                            className="form-input"
                            placeholder="Activity name"
                            style={{ marginBottom: '0.5rem' }}
                          />
                          <input
                            type="text"
                            value={activity.location}
                            onChange={(e) => updateActivity(dayIndex, activityIndex, 'location', e.target.value)}
                            className="form-input"
                            placeholder="Location"
                            style={{ marginBottom: '0.5rem' }}
                          />
                          <textarea
                            value={activity.notes}
                            onChange={(e) => updateActivity(dayIndex, activityIndex, 'notes', e.target.value)}
                            className="form-textarea"
                            placeholder="Additional notes..."
                            rows={2}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="activity-time">{activity.time}</div>
                          <div className="activity-details">
                            <h4>{activity.activity}</h4>
                            {activity.location && (
                              <div className="activity-location">📍 {activity.location}</div>
                            )}
                            {activity.notes && (
                              <div className="activity-notes">{activity.notes}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {day.activities.length === 0 && !editingItinerary && (
                    <div style={{ color: '#666', fontStyle: 'italic', padding: '1rem' }}>
                      No activities planned for this day
                    </div>
                  )}
                </div>
              ))}

              {editingItinerary && (
                <button
                  onClick={addItineraryDay}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  Add Day
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripDetails;
