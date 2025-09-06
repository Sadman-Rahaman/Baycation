// frontend/src/pages/CreateTrip.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { tripAPI } from '../services/api';

const CreateTrip = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    maxParticipants: 4,
    budget: 1000, // Single budget field
    difficulty: 'moderate',
    tripType: 'group',
    tags: '',
    requirements: ''
  });

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Trip title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Trip description is required';
    }
    
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (new Date(formData.startDate) <= new Date()) {
      newErrors.startDate = 'Start date must be in the future';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Must allow at least 1 participant';
    }
    
    if (formData.budget < 0) {
      newErrors.budget = 'Budget cannot be negative';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      // Convert single budget to min/max for backend compatibility
      const tripData = {
        ...formData,
        budget: {
          min: 0,
          max: parseFloat(formData.budget),
          currency: 'BDT' // Fixed to BDT for Bangladesh
        },
        maxParticipants: parseInt(formData.maxParticipants),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        requirements: formData.requirements ? formData.requirements.split('\n').filter(req => req.trim()) : [],
        isPublic: true // Always public
      };

      const response = await tripAPI.createTrip(tripData);
      // Show approval message and redirect to My Trips
      alert('Trip submitted for admin approval. It will appear in Browse Trips once approved.');
      navigate('/my-trips');
    } catch (error) {
      console.error('Create trip error:', error);
      if (error.response?.data?.errors) {
        const errorObj = {};
        error.response.data.errors.forEach(err => {
          if (err.includes('title')) errorObj.title = err;
          else if (err.includes('description')) errorObj.description = err;
          else if (err.includes('destination')) errorObj.destination = err;
          else if (err.includes('date')) errorObj.general = err;
          else errorObj.general = err;
        });
        setErrors(errorObj);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to create trip' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="page-container">
      <div className="form-container">
        <div className="card">
          <h2 className="form-title">Create New Trip</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
            Plan an amazing adventure and invite fellow travelers to join
          </p>
          
          {errors.general && (
            <div className="alert alert-error">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title" className="form-label">Trip Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Amazing Adventure to..."
                required
                disabled={loading}
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="destination" className="form-label">Destination *</label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="form-input"
                placeholder="Paris, France"
                required
                disabled={loading}
              />
              {errors.destination && <div className="form-error">{errors.destination}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                rows={4}
                placeholder="Describe your trip, what makes it special, what participants can expect..."
                required
                disabled={loading}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.startDate && <div className="form-error">{errors.startDate}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="endDate" className="form-label">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={loading}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
                {errors.endDate && <div className="form-error">{errors.endDate}</div>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tripType" className="form-label">Trip Type</label>
                <select
                  id="tripType"
                  name="tripType"
                  value={formData.tripType}
                  onChange={handleChange}
                  className="form-select"
                  disabled={loading}
                >
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
                <label htmlFor="difficulty" className="form-label">Difficulty Level</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="form-select"
                  disabled={loading}
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="challenging">Challenging</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maxParticipants" className="form-label">Max Participants</label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                  max="50"
                  disabled={loading}
                />
                {errors.maxParticipants && <div className="form-error">{errors.maxParticipants}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="budget" className="form-label">Budget (BDT)</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  step="100"
                  placeholder="Enter trip budget in BDT"
                  disabled={loading}
                />
                {errors.budget && <div className="form-error">{errors.budget}</div>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="tags" className="form-label">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="form-input"
                placeholder="adventure, hiking, photography, food"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="requirements" className="form-label">Requirements (one per line)</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                className="form-textarea"
                rows={3}
                placeholder="Valid passport&#10;Good physical fitness&#10;Travel insurance"
                disabled={loading}
              />
            </div>
            
            <div className="btn-group">
              <button
                type="submit"
                className="btn btn-primary btn-full-width"
                disabled={loading}
              >
                {loading ? 'Creating Trip...' : 'Create Trip'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/trips')}
                className="btn btn-secondary btn-full-width"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
