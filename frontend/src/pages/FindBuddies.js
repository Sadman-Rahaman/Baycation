// frontend/src/pages/FindBuddies.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { travelerAPI, chatAPI } from '../services/api';

const FindBuddies = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [creatingChat, setCreatingChat] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadTravelers();
  }, [isAuthenticated, navigate]);

  const loadTravelers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await travelerAPI.getAllTravelers();
      // Filter out the current user from the list
      const filteredTravelers = response.data.travelers.filter(
        traveler => traveler._id !== user?._id
      );
      setTravelers(filteredTravelers);
    } catch (error) {
      console.error('Error loading travelers:', error);
      setError('Failed to load travelers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (travelerId) => {
    try {
      setActionLoading(travelerId);
      await travelerAPI.followTraveler(travelerId);
      
      // Update the local state to reflect the follow
      setTravelers(prevTravelers => 
        prevTravelers.map(traveler => 
          traveler._id === travelerId 
            ? { ...traveler, followedBy: [...(traveler.followedBy || []), user._id] }
            : traveler
        )
      );
    } catch (error) {
      console.error('Error following traveler:', error);
      alert('Failed to follow traveler. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (travelerId) => {
    try {
      setActionLoading(travelerId);
      await travelerAPI.unfollowTraveler(travelerId);
      
      // Update the local state to reflect the unfollow
      setTravelers(prevTravelers => 
        prevTravelers.map(traveler => 
          traveler._id === travelerId 
            ? { ...traveler, followedBy: traveler.followedBy?.filter(id => id !== user._id) || [] }
            : traveler
        )
      );
    } catch (error) {
      console.error('Error unfollowing traveler:', error);
      alert('Failed to unfollow traveler. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChat = async (travelerId) => {
    try {
      setCreatingChat(travelerId);
      const response = await chatAPI.createDirectChat(travelerId);
      if (response.success && response.data.chat) {
        navigate(`/chat/${response.data.chat._id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setCreatingChat(null);
    }
  };

  const filteredTravelers = travelers.filter(traveler => {
    const matchesSearch = traveler.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         traveler.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (traveler.location && traveler.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || traveler.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          Loading travelers...
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

  return (
    <div className="page-container">
      <h1>Find Travel Buddies</h1>
      
      {/* Search and Filter Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1', minWidth: '250px' }}
          />
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="all">All Roles</option>
            <option value="traveler">Travelers</option>
            <option value="guide">Guides</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Found {filteredTravelers.length} {filteredTravelers.length === 1 ? 'traveler' : 'travelers'}
      </p>

      {/* Travelers Grid */}
      {filteredTravelers.length === 0 ? (
        <div className="empty-state">
          <h3>No travelers found</h3>
          <p>Try adjusting your search criteria or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredTravelers.map((traveler) => {
            const isFollowing = traveler.followedBy?.includes(user._id);
            
            return (
              <div key={traveler._id} className="traveler-card">
                <div className="traveler-header">
                  <h3>{traveler.name}</h3>
                  <span className={`traveler-role ${traveler.role}`}>
                    {traveler.role}
                  </span>
                </div>
                
                <div className="traveler-info">
                  <p><strong>Email:</strong> {traveler.email}</p>
                  {traveler.location && (
                    <p><strong>Location:</strong> {traveler.location}</p>
                  )}
                  {traveler.bio && (
                    <p className="traveler-bio">{traveler.bio}</p>
                  )}
                  <p><strong>Buddies:</strong> {traveler.travelBuddies?.length || 0}</p>
                  <p><strong>Followers:</strong> {traveler.followedBy?.length || 0}</p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate(`/traveler/${traveler._id}`)}
                    className="btn btn-secondary btn-small"
                    style={{ flex: '1' }}
                  >
                    View Profile
                  </button>
                  
                  {/* Follow/Unfollow Button */}
                  {isFollowing ? (
                    <button
                      onClick={() => handleUnfollow(traveler._id)}
                      disabled={actionLoading === traveler._id}
                      className="btn btn-outline btn-small"
                      style={{ flex: '1' }}
                    >
                      {actionLoading === traveler._id ? 'Processing...' : 'Unfollow'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFollow(traveler._id)}
                      disabled={actionLoading === traveler._id}
                      className="btn btn-primary btn-small"
                      style={{ flex: '1' }}
                    >
                      {actionLoading === traveler._id ? 'Processing...' : 'Follow'}
                    </button>
                  )}
                  
                  {/* Chat Button - Only show if following */}
                  {isFollowing && (
                    <button
                      onClick={() => handleStartChat(traveler._id)}
                      disabled={creatingChat === traveler._id}
                      className="btn btn-primary btn-small"
                      style={{ 
                        flex: '1',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.25rem' 
                      }}
                    >
                      {creatingChat === traveler._id ? (
                        'Starting...'
                      ) : (
                        <>
                          <span style={{ fontSize: '1.1rem' }}>💬</span>
                          Chat
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .card {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .grid {
          display: grid;
          gap: 1.5rem;
        }

        .grid-3 {
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }

        .traveler-card {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .traveler-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .traveler-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .traveler-header h3 {
          margin: 0;
          color: #2d7d32;
        }

        .traveler-role {
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .traveler-role.traveler {
          background: #e3f2fd;
          color: #1976d2;
        }

        .traveler-role.guide {
          background: #fff3e0;
          color: #f57c00;
        }

        .traveler-role.admin {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .traveler-info {
          margin-bottom: 1rem;
        }

        .traveler-info p {
          margin: 0.5rem 0;
          color: #555;
          font-size: 0.95rem;
        }

        .traveler-bio {
          font-style: italic;
          color: #666;
          margin: 0.75rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          transition: all 0.3s;
        }

        .btn-small {
          padding: 0.4rem 0.8rem;
          font-size: 0.875rem;
        }

        .btn-primary {
          background-color: #2d7d32;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #1b5e20;
        }

        .btn-secondary {
          background-color: #666;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #555;
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

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 2rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top-color: #2d7d32;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .empty-state h3 {
          color: #2d7d32;
          margin-bottom: 1rem;
        }

        .empty-state p {
          color: #666;
        }

        .alert {
          padding: 1rem;
          border-radius: 5px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background-color: #ffebee;
          color: #c62828;
          border: 1px solid #ef5350;
        }

        input[type="text"],
        select {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
        }

        input[type="text"]:focus,
        select:focus {
          outline: none;
          border-color: #2d7d32;
          box-shadow: 0 0 0 3px rgba(45, 125, 50, 0.1);
        }

        @media (max-width: 768px) {
          .grid-3 {
            grid-template-columns: 1fr;
          }

          .page-container {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FindBuddies;
