// frontend/src/components/CreateGear.js
import React, { useState } from 'react';
import { gearAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';

const CreateGear = ({ onClose, onGearCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'equipment',
    brand: '',
    condition: 'good',
    priceAmount: '',
    priceType: 'sale',
    size: '',
    color: '',
    weight: '',
    city: '',
    country: 'Bangladesh',
    pickupAddress: '',
    features: '',
    tags: '',
    images: [{ url: '', alt: '' }]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (index, field, value) => {
    const newImages = [...formData.images];
    newImages[index][field] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const addImage = () => {
    if (formData.images.length < 5) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { url: '', alt: '' }]
      }));
    }
  };

  const removeImage = (index) => {
    if (formData.images.length > 1) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Name must be at least 3 characters long.');
      return;
    }
    
    if (formData.name.trim().length > 100) {
      setError('Name cannot exceed 100 characters.');
      return;
    }
    
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }
    
    if (formData.description.trim().length > 500) {
      setError('Description cannot exceed 500 characters.');
      return;
    }
    
    if (!formData.priceAmount || parseFloat(formData.priceAmount) <= 0) {
      setError('Please enter a valid price greater than 0.');
      return;
    }
    
    if (!formData.city.trim()) {
      setError('City is required.');
      return;
    }
    
    if (!formData.country.trim()) {
      setError('Country is required.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // Prepare gear data - DON'T include gear_id as backend generates it
      const gearData = {
        // Don't include gear_id - backend will generate it
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        price: {
          amount: parseFloat(formData.priceAmount),
          currency: 'BDT',
          type: formData.priceType
        },
        availability: {
          isAvailable: true,
          availableFrom: new Date().toISOString()
        },
        location: {
          city: formData.city.trim(),
          country: formData.country.trim()
        },
        isActive: true
        // Don't set isApproved from frontend - let backend handle it
      };

      // Add optional fields only if they have values
      if (formData.brand.trim()) {
        gearData.brand = formData.brand.trim();
      }
      
      if (formData.size.trim()) {
        gearData.size = formData.size.trim();
      }
      
      if (formData.color.trim()) {
        gearData.color = formData.color.trim();
      }
      
      if (formData.weight && parseFloat(formData.weight) > 0) {
        gearData.weight = {
          value: parseFloat(formData.weight),
          unit: 'kg'
        };
      }
      
      if (formData.pickupAddress.trim()) {
        gearData.location.pickupAddress = formData.pickupAddress.trim();
      }
      
      // Process images
      const validImages = formData.images.filter(img => img.url.trim());
      if (validImages.length > 0) {
        gearData.images = validImages.map((img, index) => ({
          url: img.url.trim(),
          alt: img.alt.trim() || `Product image ${index + 1}`,
          isPrimary: index === 0
        }));
      }
      
      // Process features
      if (formData.features.trim()) {
        gearData.features = formData.features.split(',').map(f => f.trim()).filter(f => f);
      }
      
      // Process tags
      if (formData.tags.trim()) {
        gearData.tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      }

      console.log('Sending gear data:', gearData); // Debug log

      const response = await gearAPI.createGear(gearData);
      
      console.log('Response:', response); // Debug log
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'equipment',
        brand: '',
        condition: 'good',
        priceAmount: '',
        priceType: 'sale',
        size: '',
        color: '',
        weight: '',
        city: '',
        country: 'Bangladesh',
        pickupAddress: '',
        features: '',
        tags: '',
        images: [{ url: '', alt: '' }]
      });
      
      // Call the callback to refresh gear list and close modal
      onGearCreated();
      
    } catch (error) {
      console.error('Error creating gear listing:', error);
      console.error('Error response:', error.response); // Debug log
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // If backend sends validation errors array
        setError(error.response.data.errors.join(', '));
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to create listing. Please check all required fields and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-gear-modal-container">
      <form className="create-gear-form" onSubmit={handleSubmit}>
        {/* Fixed Header */}
        <div className="form-header">
          <h2>List Your Travel Gear</h2>
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
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">
                Item Name * <small>(3-100 characters)</small>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., North Face Backpack 60L"
                required
                minLength={3}
                maxLength={100}
              />
              <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                {formData.name.length}/100 characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description * <small>(10-500 characters)</small>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your item, its features, and condition..."
                required
                rows={4}
                minLength={10}
                maxLength={500}
              />
              <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                {formData.description.length}/500 characters
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="clothing">Clothing</option>
                  <option value="equipment">Equipment</option>
                  <option value="electronics">Electronics</option>
                  <option value="accessories">Accessories</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brand">Brand (Optional)</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g., North Face"
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="size">Size (Optional)</label>
                <input
                  type="text"
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="e.g., Large, 60L"
                  maxLength={30}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="color">Color (Optional)</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Blue"
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight">Weight in kg (Optional)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 2.5"
                  step="0.1"
                  min="0"
                  max="1000"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section">
            <h3 className="section-title">Pricing</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priceType">Price Type *</label>
                <select
                  id="priceType"
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent (per day)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priceAmount">
                  Price (BDT) * <small>(Must be greater than 0)</small>
                </label>
                <input
                  type="number"
                  id="priceAmount"
                  name="priceAmount"
                  value={formData.priceAmount}
                  onChange={handleInputChange}
                  placeholder="Enter price in BDT"
                  required
                  min="1"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3 className="section-title">Location</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g., Dhaka"
                  required
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="e.g., Bangladesh"
                  required
                  maxLength={50}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pickupAddress">Pickup Address (Optional)</label>
              <input
                type="text"
                id="pickupAddress"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleInputChange}
                placeholder="Specific address or area for pickup"
                maxLength={200}
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <h3 className="section-title">Additional Details (Optional)</h3>
            
            <div className="form-group">
              <label htmlFor="features">Features (comma-separated)</label>
              <input
                type="text"
                id="features"
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                placeholder="Waterproof, Lightweight, Multiple compartments"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="hiking, camping, trekking"
                maxLength={100}
              />
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h3 className="section-title">Images (Optional)</h3>
            <p className="section-description">Add up to 5 images of your item</p>
            
            {formData.images.map((image, idx) => (
              <div key={idx} className="image-item">
                <input
                  type="url"
                  value={image.url}
                  onChange={(e) => handleImageChange(idx, 'url', e.target.value)}
                  placeholder="Image URL"
                />
                <input
                  type="text"
                  value={image.alt}
                  onChange={(e) => handleImageChange(idx, 'alt', e.target.value)}
                  placeholder="Image description"
                  maxLength={100}
                />
                {formData.images.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeImage(idx)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {formData.images.length < 5 && (
              <button
                type="button"
                className="add-image-btn"
                onClick={addImage}
              >
                + Add Image
              </button>
            )}
          </div>

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
          >
            {loading ? 'Creating Listing...' : 'List Item'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>

      <style jsx>{`
        .create-gear-modal-container {
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

        .create-gear-form {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 700px;
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
          max-height: calc(90vh - 140px - 80px);
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

        /* Form Sections */
        .form-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d7d32;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e8f5e8;
        }

        .section-description {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 1rem;
        }

        /* Form Elements */
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
          color: #333;
        }

        label small {
          font-weight: normal;
          color: #666;
          font-size: 0.85rem;
        }

        input[type="text"],
        input[type="number"],
        input[type="url"],
        textarea,
        select {
          width: 100%;
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

        input:focus,
        textarea:focus,
        select:focus {
          border-color: #2d7d32;
          outline: none;
          box-shadow: 0 0 0 3px rgba(45, 125, 50, 0.1);
        }

        /* Image Section */
        .image-item {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          align-items: center;
        }

        .image-item input[type='url'] {
          flex: 2;
        }

        .image-item input[type='text'] {
          flex: 1.5;
        }

        .remove-btn {
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

        .remove-btn:hover {
          background: #d32f2f;
        }

        .add-image-btn {
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

        .add-image-btn:hover {
          background-color: #1b5e20;
        }

        /* Error Message */
        .form-error {
          background-color: #ffebee;
          border: 1px solid #f44336;
          color: #c62828;
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          text-align: center;
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
          .create-gear-modal-container {
            padding: 0;
          }

          .create-gear-form {
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

          .form-row {
            grid-template-columns: 1fr;
          }

          .image-item {
            flex-direction: column;
            align-items: stretch;
          }

          .image-item input[type='url'],
          .image-item input[type='text'] {
            flex: none;
            width: 100%;
          }

          .remove-btn {
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

export default CreateGear;
