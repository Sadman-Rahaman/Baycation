// frontend/src/pages/Trips.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { tripAPI } from '../services/api';

const Trips = () => {
  const { isAuthenticated, user } = useAuth();
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0, totalTrips: 0 });
  const [filters, setFilters] = useState({
    search: '',
    destination: '',
    tripType: '',
    difficulty: '',
    minBudget: '',
    maxBudget: '',
    page: 1
  });

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async (searchFilters = filters) => {
    try {
      setLoading(true);
      setError('');
      const response = await tripAPI.getAllTrips(searchFilters);
      setTrips(response.data.trips);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value,
      page: 1 // Reset to first page when filtering
    };
    setFilters(newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTrips(filters);
  };

  const clearFilters = () => {
    const clearedFilters = { 
      search: '', 
      destination: '', 
      tripType: '', 
      difficulty: '', 
      minBudget: '', 
      maxBudget: '', 
      page: 1 
    };
    setFilters(clearedFilters);
    loadTrips(clearedFilters);
  };

  const handlePageChange = (page) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadTrips(newFilters);
  };

  const handleJoinTrip = async (tripId) => {
    if (!isAuthenticated) {
      alert('Please login to join trips');
      return;
    }
    
    try {
      await tripAPI.joinTrip(tripId);
      // Reload trips to update participant count
      loadTrips(filters);
    } catch (error) {
      console.error('Error joining trip:', error);
      setError(error.response?.data?.message || 'Failed to join trip. Please try again.');
    }
  };

  const handleLeaveTrip = async (tripId) => {
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }
    try {
      await tripAPI.leaveTrip(tripId);
      loadTrips(filters);
    } catch (error) {
      console.error('Error leaving trip:', error);
      setError(error.response?.data?.message || 'Failed to leave trip. Please try again.');
    }
  };

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Browse Trips</h1>
          <p>Discover amazing group adventures around the world</p>
        </div>
        {isAuthenticated && (
          <Link to="/trips/create" className="btn btn-primary">
            Create Trip
          </Link>
        )}
      </div>

      <div className="search-filters">
        <form onSubmit={handleSearch}>
          <div className="search-bar">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search trips by title, description, or destination..."
              className="search-input"
            />
          </div>
          
          <div className="filters-row">
            <div className="form-group">
              <label className="form-label">Destination</label>
              <input
                type="text"
                name="destination"
                value={filters.destination}
                onChange={handleFilterChange}
                placeholder="City, Country"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Trip Type</label>
              <select
                name="tripType"
                value={filters.tripType}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Types</option>
                <option value="adventure">Adventure</option>
                <option value="cultural">Cultural</option>
                <option value="relaxation">Relaxation</option>
                <option value="business">Business</option>
                <option value="family">Family</option>
                <option value="solo">Solo</option>
                <option value="group">Group</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                name="difficulty"
                value={filters.difficulty}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Budget Range (USD)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  name="minBudget"
                  value={filters.minBudget}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  className="form-input"
                  style={{ width: '80px' }}
                />
                <input
                  type="number"
                  name="maxBudget"
                  value={filters.maxBudget}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  className="form-input"
                  style={{ width: '80px' }}
                />
              </div>
            </div>
            
            <div className="form-group" style={{ alignSelf: 'end' }}>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary btn-small">
                  Search
                </button>
                <button type="button" onClick={clearFilters} className="btn btn-secondary btn-small">
                  Clear
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Loading amazing trips...
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3>No trips found</h3>
          <p>Try adjusting your search filters or create the first trip!</p>
          {isAuthenticated && (
            <Link to="/trips/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create New Trip
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-2">
            {trips.map((trip) => (
              <div key={trip._id} className="trip-card">
                <div className="trip-header">
                  <div>
                    <h3 className="trip-title">{trip.title}</h3>
                    <p className="trip-destination">📍 {trip.destination}</p>
                  </div>
                  <span className={`trip-status ${trip.status}`}>
                    {trip.status}
                  </span>
                </div>
                
                <div className="trip-description">
                  {trip.description}
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
                    <strong>Difficulty</strong>
                    <span style={{ textTransform: 'capitalize' }}>{trip.difficulty}</span>
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
                
                <div className="btn-group">
                  <Link 
                    to={`/trips/${trip._id}`} 
                    className="btn btn-outline btn-small"
                  >
                    View Details
                  </Link>
                  {isAuthenticated && trip.participants && trip.participants.some(p => (p.user?._id || p.user) === user?._id && p.status === 'confirmed') ? (
                    <button 
                      onClick={() => handleLeaveTrip(trip._id)}
                      className="btn btn-secondary btn-small"
                    >
                      Leave Trip
                    </button>
                  ) : (
                    isAuthenticated && trip.currentParticipants < trip.maxParticipants && (
                      <button 
                        onClick={() => handleJoinTrip(trip._id)}
                        className="btn btn-primary btn-small"
                      >
                        Join Trip
                      </button>
                    )
                  )}
                  {!isAuthenticated && trip.currentParticipants < trip.maxParticipants && (
                    <Link to="/login" className="btn btn-primary btn-small">
                      Login to Join
                    </Link>
                  )}
                  {isAuthenticated && (user?.role === 'admin' || user?.email === 'admin@gmail.com') && (
                    <button
                      onClick={async () => {
                        try {
                          await tripAPI.deleteTrip(trip._id);
                          loadTrips(filters);
                        } catch (error) {
                          setError(error.response?.data?.message || 'Failed to delete trip');
                        }
                      }}
                      className="btn btn-danger btn-small"
                    >
                      Delete Trip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.total > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(1)}
                disabled={pagination.current === 1}
              >
                First
              </button>
              <button 
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
              >
                Previous
              </button>
              
              {[...Array(Math.min(5, pagination.total))].map((_, index) => {
                const page = index + Math.max(1, pagination.current - 2);
                if (page > pagination.total) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={pagination.current === page ? 'active' : ''}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button 
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.total}
              >
                Next
              </button>
              <button 
                onClick={() => handlePageChange(pagination.total)}
                disabled={pagination.current === pagination.total}
              >
                Last
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', color: '#666', marginTop: '1rem' }}>
            Showing {pagination.count} of {pagination.totalTrips} trips
          </div>
        </>
      )}
    </div>
  );
};

export default Trips;
