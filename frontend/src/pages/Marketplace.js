// frontend/src/pages/Marketplace.js
import React, { useState, useEffect } from 'react';
import { gearAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import CreateGear from '../components/CreateGear';

const Marketplace = () => {
  const { isAuthenticated, user } = useAuth();
  const [gear, setGear] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceType, setPriceType] = useState('all');
  const [showCreateGear, setShowCreateGear] = useState(false);
  const [showGearDetails, setShowGearDetails] = useState(false);
  const [selectedGear, setSelectedGear] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalGear: 0
  });

  useEffect(() => {
    loadGear();
  }, [searchTerm, priceType, pagination.current]);

  const loadGear = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters = {
        page: pagination.current,
        limit: 12
      };
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      if (priceType !== 'all') {
        filters.priceType = priceType;
      }
      
      const response = await gearAPI.getAllGear(filters);
      setGear(response.data.gear || []);
      setPagination(response.data.pagination || pagination);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load marketplace items');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (gearId) => {
    try {
      setDetailsLoading(true);
      setShowGearDetails(true);
      const response = await gearAPI.getGear(gearId);
      setSelectedGear(response.data.gear);
    } catch (err) {
      console.error('Error loading gear details:', err);
      setError('Failed to load gear details');
      setShowGearDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeGearDetails = () => {
    setShowGearDetails(false);
    setSelectedGear(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    loadGear();
  };

  const handlePriceTypeChange = (type) => {
    setPriceType(type);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleGearCreated = () => {
    setShowCreateGear(false);
    loadGear();
  };

  const formatPrice = (price) => {
    return `৳${price.amount.toLocaleString()} BDT`;
  };

  const formatPriceType = (type) => {
    return type === 'rent' ? 'For Rent' : 'For Sale';
  };

  const formatCondition = (condition) => {
    const conditions = {
      'new': '✨ Brand New',
      'like-new': '👍 Like New',
      'good': '✓ Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };
    return conditions[condition] || condition;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Gear Details Modal Component
  const GearDetailsModal = () => {
    if (!showGearDetails) return null;

    return (
      <div className="modal-overlay" onClick={closeGearDetails}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeGearDetails}>×</button>
          
          {detailsLoading ? (
            <div className="modal-loading">
              <div className="loading-spinner"></div>
              <p>Loading gear details...</p>
            </div>
          ) : selectedGear ? (
            <div className="gear-details">
              <div className="details-header">
                <h2>{selectedGear.name}</h2>
                <div className="details-badges">
                  <span className={`badge ${selectedGear.price.type}`}>
                    {formatPriceType(selectedGear.price.type)}
                  </span>
                  <span className="badge condition">
                    {formatCondition(selectedGear.condition)}
                  </span>
                </div>
              </div>

              {/* Images Section */}
              <div className="details-images">
                {selectedGear.images && selectedGear.images.length > 0 ? (
                  <div className="image-gallery">
                    <img 
                      src={selectedGear.images[0].url} 
                      alt={selectedGear.name}
                      className="main-image"
                    />
                    {selectedGear.images.length > 1 && (
                      <div className="thumbnail-row">
                        {selectedGear.images.slice(1, 5).map((img, idx) => (
                          <img 
                            key={idx}
                            src={img.url} 
                            alt={img.alt || `${selectedGear.name} ${idx + 2}`}
                            className="thumbnail"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-image-placeholder">
                    <span>📷</span>
                    <p>No images available</p>
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="details-price">
                <span className="price-amount">{formatPrice(selectedGear.price)}</span>
                {selectedGear.price.type === 'rent' && <span className="price-period">/day</span>}
              </div>

              {/* Description */}
              <div className="details-section">
                <h3>Description</h3>
                <p>{selectedGear.description}</p>
              </div>

              {/* Details Grid */}
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">{selectedGear.category}</span>
                </div>
                {selectedGear.brand && (
                  <div className="detail-item">
                    <span className="detail-label">Brand</span>
                    <span className="detail-value">{selectedGear.brand}</span>
                  </div>
                )}
                {selectedGear.size && (
                  <div className="detail-item">
                    <span className="detail-label">Size</span>
                    <span className="detail-value">{selectedGear.size}</span>
                  </div>
                )}
                {selectedGear.color && (
                  <div className="detail-item">
                    <span className="detail-label">Color</span>
                    <span className="detail-value">{selectedGear.color}</span>
                  </div>
                )}
                {selectedGear.weight && selectedGear.weight.value && (
                  <div className="detail-item">
                    <span className="detail-label">Weight</span>
                    <span className="detail-value">
                      {selectedGear.weight.value} {selectedGear.weight.unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              {selectedGear.features && selectedGear.features.length > 0 && (
                <div className="details-section">
                  <h3>Features</h3>
                  <ul className="features-list">
                    {selectedGear.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Location */}
              <div className="details-section">
                <h3>Location</h3>
                <p>📍 {selectedGear.location.city}, {selectedGear.location.country}</p>
                {selectedGear.location.pickupAddress && (
                  <p className="pickup-address">
                    <strong>Pickup:</strong> {selectedGear.location.pickupAddress}
                  </p>
                )}
              </div>

              {/* Seller Info */}
              <div className="details-section seller-section">
                <h3>Seller Information</h3>
                <div className="seller-info">
                  <p><strong>Name:</strong> {selectedGear.seller.name}</p>
                  <p><strong>Email:</strong> {selectedGear.seller.email}</p>
                  <p><strong>Listed on:</strong> {formatDate(selectedGear.createdAt)}</p>
                  {selectedGear.viewCount > 0 && (
                    <p><strong>Views:</strong> {selectedGear.viewCount}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="details-actions">
                {isAuthenticated ? (
                  user?._id === selectedGear.seller._id ? (
                    <button className="btn btn-primary">Edit Listing</button>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={() => alert(`Contact ${selectedGear.seller.name} at ${selectedGear.seller.email}`)}
                    >
                      Contact Seller
                    </button>
                  )
                ) : (
                  <p className="login-prompt">Please login to contact the seller</p>
                )}
              </div>
            </div>
          ) : (
            <div className="modal-error">
              <p>Failed to load gear details</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="marketplace-container">
      {/* Hero Section */}
      <div className="marketplace-hero">
        <div className="hero-content">
          <h1 className="hero-title">Travel Gear Marketplace</h1>
          <p className="hero-subtitle">
            Find quality travel equipment for your next adventure - Buy or Rent
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hero-search">
            <div className="search-wrapper">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for camping gear, backpacks, cameras..."
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </form>

          {/* Price Type Tabs */}
          <div className="price-type-tabs">
            <button
              className={`tab-btn ${priceType === 'all' ? 'active' : ''}`}
              onClick={() => handlePriceTypeChange('all')}
            >
              <span className="tab-icon">🏪</span>
              All Items
            </button>
            <button
              className={`tab-btn ${priceType === 'sale' ? 'active' : ''}`}
              onClick={() => handlePriceTypeChange('sale')}
            >
              <span className="tab-icon">🛒</span>
              For Sale
            </button>
            <button
              className={`tab-btn ${priceType === 'rent' ? 'active' : ''}`}
              onClick={() => handlePriceTypeChange('rent')}
            >
              <span className="tab-icon">📅</span>
              For Rent
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="marketplace-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Results Header */}
        {!loading && (
          <div className="results-header">
            <div className="results-count">
              <h2>
                {priceType === 'all' ? 'All Items' : 
                 priceType === 'rent' ? 'Items for Rent' : 'Items for Sale'}
              </h2>
              <p>{pagination.totalGear} items found</p>
            </div>
            {isAuthenticated && (
              <button 
                onClick={() => setShowCreateGear(true)}
                className="btn-create"
              >
                <span>+</span> List Your Gear
              </button>
            )}
          </div>
        )}

        {/* Gear Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading marketplace items...</p>
          </div>
        ) : gear.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎒</div>
            <h3>No items found</h3>
            <p>
              {searchTerm 
                ? `No items match "${searchTerm}". Try a different search.`
                : 'Be the first to list travel gear!'}
            </p>
            {isAuthenticated && (
              <button 
                onClick={() => setShowCreateGear(true)}
                className="btn btn-primary"
              >
                List Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="gear-grid">
            {gear.map(item => (
              <div key={item._id} className="gear-card">
                <div className="gear-image">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0].url} alt={item.name} />
                  ) : (
                    <div className="placeholder-image">
                      <span className="placeholder-icon">📷</span>
                      <span>No Image</span>
                    </div>
                  )}
                  <div className="gear-badges">
                    <span className={`badge ${item.price.type}`}>
                      {formatPriceType(item.price.type)}
                    </span>
                    {item.condition === 'new' && (
                      <span className="badge new">New</span>
                    )}
                  </div>
                </div>
                
                <div className="gear-content">
                  <div className="gear-header">
                    <h3 className="gear-name">{item.name}</h3>
                    <div className="gear-price">
                      <span className="price-amount">{formatPrice(item.price)}</span>
                      {item.price.type === 'rent' && (
                        <span className="price-period">/day</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="gear-meta">
                    <span className="gear-category">
                      <span className="meta-icon">📦</span>
                      {item.category}
                    </span>
                    <span className="gear-condition">
                      {formatCondition(item.condition)}
                    </span>
                  </div>
                  
                  <p className="gear-description">{item.description}</p>
                  
                  <div className="gear-location">
                    <span className="location-icon">📍</span>
                    {item.location.city}, {item.location.country}
                  </div>
                  
                  <div className="gear-seller">
                    <div className="seller-info">
                      <span className="seller-label">Listed by</span>
                      <span className="seller-name">{item.seller.name}</span>
                    </div>
                    {item.viewCount > 0 && (
                      <span className="view-count">👁️ {item.viewCount} views</span>
                    )}
                  </div>
                  
                  <div className="gear-actions">
                    <button 
                      className="btn-view"
                      onClick={() => handleViewDetails(item._id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
              disabled={pagination.current === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <div className="pagination-info">
              Page {pagination.current} of {pagination.total}
            </div>
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
              disabled={pagination.current === pagination.total}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Create Gear Modal */}
      {showCreateGear && (
        <CreateGear
          onGearCreated={handleGearCreated}
          onClose={() => setShowCreateGear(false)}
        />
      )}

      {/* Gear Details Modal */}
      <GearDetailsModal />

      <style jsx>{`
        .marketplace-container {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .marketplace-hero {
          background: linear-gradient(135deg, #2d7d32 0%, #4caf50 100%);
          color: white;
          padding: 4rem 1rem 3rem;
          position: relative;
          overflow: hidden;
        }

        .marketplace-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('/pattern.svg') repeat;
          opacity: 0.1;
        }

        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin: 0 0 2.5rem 0;
          opacity: 0.95;
        }

        .hero-search {
          max-width: 600px;
          margin: 0 auto 2rem;
        }

        .search-wrapper {
          display: flex;
          background: white;
          border-radius: 50px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .search-input {
          flex: 1;
          padding: 1.25rem 1.5rem;
          border: none;
          font-size: 1.1rem;
          outline: none;
          color: #333;
        }

        .search-btn {
          background: #2d7d32;
          color: white;
          border: none;
          padding: 0 2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          transition: background 0.3s;
        }

        .search-btn:hover {
          background: #1b5e20;
        }

        .search-icon {
          width: 20px;
          height: 20px;
        }

        .price-type-tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .tab-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          padding: 0.75rem 1.75rem;
          border-radius: 25px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .tab-btn.active {
          background: white;
          color: #2d7d32;
          border-color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .marketplace-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 1rem;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .results-count h2 {
          margin: 0;
          color: #333;
        }

        .results-count p {
          margin: 0.25rem 0 0 0;
          color: #666;
        }

        .btn-create {
          background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
          transition: all 0.3s;
        }

        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }

        .btn-create span {
          font-size: 1.5rem;
          line-height: 1;
        }

        .loading-container {
          text-align: center;
          padding: 4rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e0e0e0;
          border-top-color: #4caf50;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .empty-state p {
          color: #666;
          margin: 0 0 2rem 0;
        }

        .gear-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .gear-card {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .gear-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .gear-image {
          position: relative;
          height: 200px;
          background: #f5f5f5;
        }

        .gear-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-image {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #999;
        }

        .placeholder-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .gear-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.rent {
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
        }

        .badge.sale {
          background: linear-gradient(135deg, #4caf50, #45a049);
          color: white;
        }

        .badge.new {
          background: linear-gradient(135deg, #2196f3, #1976d2);
          color: white;
        }

        .badge.condition {
          background: #e3f2fd;
          color: #1976d2;
        }

        .gear-content {
          padding: 1.5rem;
        }

        .gear-header {
          margin-bottom: 1rem;
        }

        .gear-name {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .gear-price {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .price-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d7d32;
        }

        .price-period {
          color: #666;
          font-size: 0.875rem;
        }

        .gear-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .gear-category {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #666;
        }

        .meta-icon {
          font-size: 1rem;
        }

        .gear-condition {
          color: #666;
          font-weight: 500;
        }

        .gear-description {
          margin: 0 0 1rem 0;
          color: #555;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .gear-location {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .location-icon {
          font-size: 1rem;
        }

        .gear-seller {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-top: 1px solid #e0e0e0;
          margin-bottom: 1rem;
        }

        .seller-info {
          display: flex;
          flex-direction: column;
        }

        .seller-label {
          font-size: 0.75rem;
          color: #999;
        }

        .seller-name {
          font-weight: 600;
          color: #333;
        }

        .view-count {
          font-size: 0.875rem;
          color: #666;
        }

        .gear-actions {
          display: flex;
          justify-content: center;
        }

        .btn-view {
          flex: 1;
          background: #2d7d32;
          color: white;
          text-align: center;
          padding: 0.75rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-view:hover {
          background: #1b5e20;
          transform: translateY(-2px);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 15px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s;
        }

        .modal-close:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .modal-loading {
          padding: 4rem;
          text-align: center;
        }

        .modal-error {
          padding: 4rem;
          text-align: center;
          color: #c62828;
        }

        .gear-details {
          padding: 2rem;
        }

        .details-header {
          margin-bottom: 2rem;
        }

        .details-header h2 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 2rem;
        }

        .details-badges {
          display: flex;
          gap: 0.5rem;
        }

        .details-images {
          margin-bottom: 2rem;
        }

        .image-gallery {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .main-image {
          width: 100%;
          max-height: 400px;
          object-fit: cover;
          border-radius: 10px;
        }

        .thumbnail-row {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
        }

        .thumbnail {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 5px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.3s;
        }

        .thumbnail:hover {
          border-color: #4caf50;
        }

        .no-image-placeholder {
          background: #f5f5f5;
          padding: 4rem;
          text-align: center;
          border-radius: 10px;
          color: #999;
        }

        .no-image-placeholder span {
          font-size: 3rem;
        }

        .details-price {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #e8f5e8;
          border-radius: 10px;
        }

        .details-section {
          margin-bottom: 2rem;
        }

        .details-section h3 {
          margin: 0 0 1rem 0;
          color: #2d7d32;
          font-size: 1.25rem;
        }

        .details-section p {
          color: #555;
          line-height: 1.6;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.875rem;
          color: #666;
          font-weight: 600;
        }

        .detail-value {
          color: #333;
          font-size: 1rem;
        }

        .features-list {
          list-style: none;
          padding: 0;
        }

        .features-list li {
          padding: 0.5rem 0;
          color: #555;
          position: relative;
          padding-left: 1.5rem;
        }

        .features-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #4caf50;
          font-weight: bold;
        }

        .pickup-address {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #f9f9f9;
          border-radius: 5px;
        }

        .seller-section {
          background: #f9f9f9;
          padding: 1.5rem;
          border-radius: 10px;
        }

        .seller-info p {
          margin: 0.5rem 0;
        }

        .details-actions {
          text-align: center;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }

        .login-prompt {
          color: #666;
          font-style: italic;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #2d7d32;
          color: white;
        }

        .btn-primary:hover {
          background: #1b5e20;
          transform: translateY(-2px);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 3rem;
        }

        .pagination-btn {
          background: white;
          color: #333;
          border: 2px solid #e0e0e0;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #2d7d32;
          color: white;
          border-color: #2d7d32;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-weight: 600;
          color: #666;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background-color: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .search-wrapper {
            flex-direction: column;
            border-radius: 10px;
          }

          .search-btn {
            padding: 1rem;
            justify-content: center;
          }

          .results-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .gear-grid {
            grid-template-columns: 1fr;
          }

          .price-type-tabs {
            flex-direction: column;
          }

          .tab-btn {
            width: 100%;
            justify-content: center;
          }

          .modal-content {
            max-height: 100vh;
            border-radius: 0;
          }

          .gear-details {
            padding: 1rem;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .marketplace-hero {
            padding: 2rem 1rem;
          }

          .gear-card {
            border-radius: 10px;
          }

          .gear-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Marketplace;
