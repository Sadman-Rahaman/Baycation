// frontend/src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferences: '',
    bio: '',
    location: '',
    role: 'traveler'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    
    setErrors({});
    setLoading(true);

    const result = await register({
      name: formData.name.trim(),
      email: formData.email,
      password: formData.password,
      preferences: formData.preferences,
      bio: formData.bio,
      location: formData.location,
      role: formData.role
    });
    
    if (result.success) {
      navigate('/');
    } else {
      if (result.errors) {
        const errorObj = {};
        result.errors.forEach(error => {
          if (error.includes('email')) {
            errorObj.email = error;
          } else if (error.includes('password')) {
            errorObj.password = error;
          } else if (error.includes('name')) {
            errorObj.name = error;
          } else {
            errorObj.general = error;
          }
        });
        setErrors(errorObj);
      } else {
        setErrors({ general: result.message });
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="register-container">
        <div className="register-card">
          {/* Header Section */}
          <div className="register-header">
            <div className="logo-section">
              <img src="/baycation-logo.png" alt="Baycation" className="register-logo" />
            </div>
            <h2 className="register-title">Create Your Account</h2>
            <p className="register-subtitle">Join thousands of travelers exploring the world together</p>
          </div>
          
          {errors.general && (
            <div className="alert alert-error">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="register-form">
            {/* Essential Information Section */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-number">1</span>
                Essential Information
              </h3>
              
              {/* Full Name - Full Width */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <span className="label-icon">👤</span>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              
              {/* Email - Full Width */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
            </div>

            {/* Security Section */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-number">2</span>
                Security
              </h3>
              
              {/* Password Fields - Side by Side */}
              <div className="password-row">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    <span className="label-icon">🔒</span>
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Min 6 characters"
                    required
                    disabled={loading}
                  />
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    <span className="label-icon">🔒</span>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Re-enter password"
                    required
                    disabled={loading}
                  />
                  {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                </div>
              </div>
            </div>

            {/* Account Type Section */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-number">3</span>
                Account Type
              </h3>
              
              <div className="role-selector">
                <label className={`role-option ${formData.role === 'traveler' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="traveler"
                    checked={formData.role === 'traveler'}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span className="role-icon">🎒</span>
                  <span className="role-title">Traveler</span>
                  <span className="role-description">Explore and join trips</span>
                </label>
                
                <label className={`role-option ${formData.role === 'guide' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="guide"
                    checked={formData.role === 'guide'}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span className="role-icon">🧭</span>
                  <span className="role-title">Tour Guide</span>
                  <span className="role-description">Lead and organize trips</span>
                </label>
              </div>
            </div>

            {/* Optional Profile Information - Collapsible */}
            <div className="form-section optional-section">
              <button
                type="button"
                className="optional-toggle"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
              >
                <span className="section-title">
                  <span className="section-number">4</span>
                  Profile Details (Optional)
                </span>
                <span className="toggle-icon">{showOptionalFields ? '−' : '+'}</span>
              </button>
              
              {showOptionalFields && (
                <div className="optional-fields">
                  <div className="form-group">
                    <label htmlFor="location" className="form-label">
                      <span className="label-icon">📍</span>
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="City, Country"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bio" className="form-label">
                      <span className="label-icon">✍️</span>
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="form-textarea"
                      placeholder="Tell us a bit about yourself..."
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="preferences" className="form-label">
                      <span className="label-icon">🌟</span>
                      Travel Preferences
                    </label>
                    <textarea
                      id="preferences"
                      name="preferences"
                      value={formData.preferences}
                      onChange={handleChange}
                      className="form-textarea"
                      placeholder="What kind of trips do you enjoy? Beach, mountains, cities..."
                      disabled={loading}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-full-width register-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          {/* Footer */}
          <div className="register-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="register-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .register-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .register-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .register-header {
          background: linear-gradient(135deg, #2d7d32 0%, #4caf50 100%);
          color: white;
          padding: 2.5rem 2rem;
          text-align: center;
        }

        .register-logo {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .register-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .register-subtitle {
          font-size: 1rem;
          opacity: 0.95;
          margin: 0;
        }

        .register-form {
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d7d32;
          margin-bottom: 1.25rem;
        }

        .section-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #e8f5e8;
          color: #2d7d32;
          border-radius: 50%;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .label-icon {
          font-size: 1.1rem;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #fafafa;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #4caf50;
          background: white;
          box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: #999;
        }

        .password-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .role-option {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .role-option:hover {
          border-color: #4caf50;
          background: #f8fff8;
        }

        .role-option.selected {
          border-color: #2d7d32;
          background: #e8f5e8;
        }

        .role-option input[type="radio"] {
          position: absolute;
          opacity: 0;
        }

        .role-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .role-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .role-description {
          font-size: 0.85rem;
          color: #666;
        }

        .optional-section {
          border: 2px solid #e8f5e8;
          border-radius: 12px;
          overflow: hidden;
        }

        .optional-toggle {
          width: 100%;
          padding: 1rem 1.5rem;
          background: #f8fff8;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .optional-toggle:hover {
          background: #e8f5e8;
        }

        .toggle-icon {
          font-size: 1.5rem;
          color: #2d7d32;
        }

        .optional-fields {
          padding: 1.5rem;
          background: white;
          border-top: 2px solid #e8f5e8;
        }

        .register-submit {
          margin-top: 2rem;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .register-footer {
          padding: 1.5rem 2rem;
          background: #f9f9f9;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }

        .register-footer p {
          margin: 0;
          color: #666;
        }

        .register-link {
          color: #2d7d32;
          text-decoration: none;
          font-weight: 600;
        }

        .register-link:hover {
          text-decoration: underline;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .register-container {
            margin: 1rem auto;
          }

          .register-header {
            padding: 2rem 1.5rem;
          }

          .register-form {
            padding: 1.5rem;
          }

          .password-row,
          .role-selector {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
