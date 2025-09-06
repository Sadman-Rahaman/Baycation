// frontend/src/pages/Home.js
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { tripAPI } from '../services/api';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [feedTrips, setFeedTrips] = useState([]);
  const [feedError, setFeedError] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);

  useEffect(() => {
    const loadFeed = async () => {
      if (!isAuthenticated) return;
      try {
        setFeedLoading(true);
        const resp = await tripAPI.getFeed();
        const trips = resp?.data?.trips || resp?.data?.data?.trips || resp?.trips || [];
        setFeedTrips(Array.isArray(trips) ? trips : []);
      } catch (e) {
        setFeedError(e?.response?.data?.message || 'Could not load your feed yet.');
      } finally {
        setFeedLoading(false);
      }
    };
    loadFeed();
  }, [isAuthenticated]);

  return (
    <div className="container">
      <div 
        className="hero-card"
        style={{
          background: `url(${process.env.PUBLIC_URL}/travel-022.jpg) center/cover no-repeat`,
          height: '45vh',
          minHeight: '310px',
          maxHeight: '500px',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          overflow: 'hidden'
        }}
      >
      </div>

      {isAuthenticated && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>From people you follow</h2>
          {feedError && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{feedError}</div>}
          {feedLoading ? (
            <div className="loading" style={{ marginTop: '1rem' }}>
              <div className="spinner"></div>
              Loading your feed...
            </div>
          ) : feedTrips.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '1rem' }}>
              <p>You’ll see trips from people you follow here. Follow travelers who have public trips.</p>
              <Link to="/find-buddies" className="btn btn-outline btn-small" style={{ marginTop: '0.5rem' }}>Find people to follow</Link>
            </div>
          ) : (
            <div className="carousel" style={{ display: 'flex', overflowX: 'auto', gap: '1rem', padding: '1rem 0' }}>
              {feedTrips.map(trip => (
                <div key={trip._id} className="card" style={{ minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{trip.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#666' }}>
                    <span>by {trip.organizer?.name}</span>
                    <span>📍 {trip.destination}</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', opacity: 0.9, margin: 0 }}>{trip.description?.slice(0, 120)}{trip.description && trip.description.length > 120 ? '…' : ''}</p>
                  <Link to={`/trips/${trip._id}`} className="btn btn-primary btn-small" style={{ marginTop: '0.5rem' }}>
                    View Trip
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-3" style={{ marginTop: '3rem' }}>
        <div className="card">
          <h3 style={{ color: '#2d7d32', marginBottom: '1rem' }}>🤝 Find Travel Buddies</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Connect with like-minded travelers who share your interests and travel style. 
            Build lasting friendships through shared adventures.
          </p>
          <Link to={isAuthenticated ? "/find-buddies" : "/register"} className="btn btn-outline btn-small">
            {isAuthenticated ? "Explore" : "Get Started"}
          </Link>
        </div>
        
        <div className="card">
          <h3 style={{ color: '#2d7d32', marginBottom: '1rem' }}>🗺️ Plan Amazing Trips</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Create detailed trip plans, collaborate with fellow travelers, and organize 
            unforgettable group adventures to destinations around the world.
          </p>
          <Link to={isAuthenticated ? "/trips/create" : "/register"} className="btn btn-outline btn-small">
            {isAuthenticated ? "Create Trip" : "Get Started"}
          </Link>
        </div>
        
        <div className="card">
          <h3 style={{ color: '#2d7d32', marginBottom: '1rem' }}>✈️ Join Group Adventures</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Browse exciting trips organized by other travelers and guides. 
            Find the perfect adventure that matches your budget and interests.
          </p>
          <Link to="/trips" className="btn btn-outline btn-small">
            Browse Trips
          </Link>
        </div>
      </div>

      {/* Removed Why Choose Baycation section */}
    </div>
  );
};

export default Home;