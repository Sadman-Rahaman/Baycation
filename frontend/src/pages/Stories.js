// frontend/src/pages/Stories.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { storyAPI } from '../services/api';
import CreateStory from '../components/CreateStory';
import StoryCard from '../components/StoryCard';

const Stories = () => {
  const { isAuthenticated, user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [activeTab, setActiveTab] = useState('following'); // 'following' or 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadStories();
    }
  }, [isAuthenticated, activeTab]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      const params = {};
      
      if (selectedLocation) params.location = selectedLocation;
      if (selectedTags) params.tags = selectedTags;
      
      if (activeTab === 'following') {
        response = await storyAPI.getFollowingFeed(params);
      } else {
        response = await storyAPI.getStoriesFeed(params);
      }
      
      setStories(response.data.stories);
    } catch (error) {
      console.error('Error loading stories:', error);
      setError('Failed to load stories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStoryCreated = () => {
    setShowCreateStory(false);
    loadStories();
  };

  const handleStoryUpdate = () => {
    loadStories();
  };

  const handleSearch = () => {
    loadStories();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLocation('');
    setSelectedTags('');
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ 
          maxWidth: '500px', 
          margin: '0 auto',
          padding: '2rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '10px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ color: '#2d7d32', marginBottom: '1rem' }}>Welcome to Travel Stories</h2>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            Discover amazing travel experiences shared by travelers around the world. 
            Log in to share your own adventures and connect with fellow explorers.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="/login" className="btn btn-primary">Log In</a>
            <a href="/register" className="btn btn-outline">Sign Up</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#2d7d32' }}>Travel Stories</h1>
          <p style={{ margin: '0', color: '#666' }}>
            Discover and share amazing travel experiences from around the world
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateStory(true)}
          style={{ 
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '25px',
            boxShadow: '0 2px 8px rgba(45, 125, 50, 0.2)'
          }}
        >
          + Share Your Story
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '1rem'
      }}>
        <button
          className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '25px',
            backgroundColor: activeTab === 'following' ? '#2d7d32' : '#f5f5f5',
            color: activeTab === 'following' ? 'white' : '#666',
            fontWeight: activeTab === 'following' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Following ({stories.filter(s => s.author && user?.travelBuddies?.includes(s.author._id)).length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '25px',
            backgroundColor: activeTab === 'all' ? '#2d7d32' : '#f5f5f5',
            color: activeTab === 'all' ? 'white' : '#666',
            fontWeight: activeTab === 'all' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Discover All Stories
        </button>
      </div>

      {/* Search and Filter Section */}
      <div style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '1.5rem', 
        borderRadius: '10px', 
        marginBottom: '2rem',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              Search by location
            </label>
            <input
              type="text"
              placeholder="e.g., Paris, Tokyo, Bali"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              Filter by tags
            </label>
            <input
              type="text"
              placeholder="adventure, culture, food"
              value={selectedTags}
              onChange={(e) => setSelectedTags(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={handleSearch}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Search
            </button>
            <button 
              onClick={clearFilters}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1rem' }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '1rem', 
          borderRadius: '5px', 
          marginBottom: '2rem',
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 1rem',
          color: '#666'
        }}>
          <div style={{ 
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #2d7d32',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Loading amazing stories...</p>
        </div>
      ) : (
        <>
          {/* Stories Feed */}
          {stories.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem',
              backgroundColor: '#f9f9f9',
              borderRadius: '10px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
              <h3 style={{ color: '#2d7d32', marginBottom: '1rem' }}>
                {activeTab === 'following' 
                  ? "No stories from your network yet" 
                  : "No stories found"
                }
              </h3>
              <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                {activeTab === 'following' 
                  ? "Follow some travelers to see their stories here, or explore all stories to discover amazing adventures."
                  : "Be the first to share a travel story and inspire others with your adventures!"
                }
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {activeTab === 'following' && (
                  <button 
                    onClick={() => setActiveTab('all')}
                    className="btn btn-outline"
                  >
                    Discover All Stories
                  </button>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateStory(true)}
                >
                  Share Your Story
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stories Count */}
              <div style={{ 
                marginBottom: '1.5rem', 
                color: '#666',
                fontSize: '1rem'
              }}>
                Found {stories.length} {stories.length === 1 ? 'story' : 'stories'}
                {activeTab === 'following' ? ' from your network' : ''}
              </div>

              {/* Stories Grid - 3 columns */}
              <div className="stories-grid" style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem'
              }}>
                {stories.map((story) => (
                  <StoryCard
                    key={story._id}
                    story={story}
                    onUpdate={handleStoryUpdate}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Call to Action Section */}
      {!loading && stories.length > 0 && (
        <div style={{ 
          textAlign: 'center',
          padding: '3rem 2rem',
          backgroundColor: '#f0f8f0',
          borderRadius: '15px',
          border: '1px solid #c8e6c9',
          marginTop: '3rem'
        }}>
          <h3 style={{ color: '#2d7d32', marginBottom: '1rem' }}>
            Have Your Own Travel Story to Share?
          </h3>
          <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Inspire fellow travelers with your adventures, hidden gems, and memorable experiences 
            from around the world.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateStory(true)}
            style={{ 
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              borderRadius: '25px'
            }}
          >
            Share Your Adventure
          </button>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <CreateStory
            onStoryCreated={handleStoryCreated}
            onClose={() => setShowCreateStory(false)}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 5px;
          text-decoration: none;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background-color: #2d7d32;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #1b5e20;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(45, 125, 50, 0.3);
        }
        
        .btn-outline {
          background-color: transparent;
          color: #2d7d32;
          border: 2px solid #2d7d32;
        }
        
        .btn-outline:hover {
          background-color: #2d7d32;
          color: white;
        }
        
        .btn-secondary {
          background-color: #666;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #555;
        }
        
        @media (max-width: 1200px) {
          .stories-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }
          
          .stories-grid {
            grid-template-columns: 1fr !important;
          }
          
          .search-filters {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Stories;
