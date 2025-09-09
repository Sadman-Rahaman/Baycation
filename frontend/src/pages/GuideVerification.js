import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { guideVerificationAPI } from '../services/api';

const GuideVerification = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nationality: 'Bangladeshi',
    experienceYears: '',
    experienceDescription: '',
    specializations: [],
    languages: '',
    idDocumentType: 'national_id',
    idDocument: null,
    idDocumentPreview: '',
    profilePhoto: null,
    profilePhotoPreview: ''
  });

  // FIXED: Updated specialization options with correct mapping
  const specializationOptions = [
    { label: 'Adventure Tours', value: 'adventure' },
    { label: 'Cultural Tours', value: 'cultural' },
    { label: 'Historical Sites', value: 'historical' },
    { label: 'Nature & Wildlife', value: 'nature' },
    { label: 'Culinary Tours', value: 'culinary' },
    { label: 'Photography Tours', value: 'photography' },
    { label: 'Language Tours', value: 'language' },
    { label: 'Other', value: 'other' }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    checkVerificationStatus();
  }, [isAuthenticated]);

  const checkVerificationStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await guideVerificationAPI.getVerificationStatus();
      if (response.data.verification) {
        setVerificationStatus(response.data.verification);
      }
    } catch (error) {
      console.log('No existing verification found');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File size should not exceed 5MB`);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          [fieldName]: file,
          [`${fieldName}Preview`]: reader.result
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        [fieldName]: file,
        [`${fieldName}Preview`]: null
      });
    }
    setError('');
  };

  // FIXED: Updated to handle specialization value properly
  const handleSpecializationChange = (specValue) => {
    const specs = [...formData.specializations];
    if (specs.includes(specValue)) {
      setFormData({
        ...formData,
        specializations: specs.filter(s => s !== specValue)
      });
    } else {
      setFormData({
        ...formData,
        specializations: [...specs, specValue]
      });
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.phone || !formData.experienceYears || 
        !formData.experienceDescription || formData.specializations.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    // Document validation
    if (!formData.idDocument || !formData.profilePhoto) {
      setError('Please upload both ID document and profile photo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert files to base64 for upload
      const idDocumentBase64 = await convertFileToBase64(formData.idDocument);
      const profilePhotoBase64 = await convertFileToBase64(formData.profilePhoto);

      // FIXED: Send specializations directly without transformation
      const verificationData = {
        personalInfo: {
          fullName: formData.fullName,
          dateOfBirth: new Date('1990-01-01'), // You can add date picker if needed
          nationality: formData.nationality,
          phone: formData.phone,
          emergencyContact: {
            name: formData.fullName,
            phone: formData.phone,
            relationship: 'self'
          }
        },
        professionalInfo: {
          experience: {
            years: parseInt(formData.experienceYears),
            description: formData.experienceDescription
          },
          specializations: formData.specializations, // FIXED: Send values directly, no transformation
          languages: formData.languages.split(',').map(lang => ({
            language: lang.trim(),
            proficiency: 'intermediate'
          })).filter(l => l.language),
          certifications: [],
          previousEmployers: []
        },
        documents: {
          idDocumentType: formData.idDocumentType,
          idDocument: idDocumentBase64,
          profilePhoto: profilePhotoBase64,
          additionalDocuments: []
        },
        references: [
          {
            name: 'Reference 1',
            email: 'ref1@example.com',
            phone: '000-000-0000'
          },
          {
            name: 'Reference 2',
            email: 'ref2@example.com',
            phone: '000-000-0000'
          }
        ]
      };

      console.log('Submitting verification with specializations:', verificationData.professionalInfo.specializations);

      await guideVerificationAPI.submitVerification(verificationData);
      setSuccess('Your application has been submitted successfully! We will review it within 24-48 hours.');
      
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
      
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="container">
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Checking status...</p>
        </div>
      </div>
    );
  }

  // Show status if already applied
  if (verificationStatus) {
    return (
      <div className="container">
        <div className="status-card">
          <div className="status-icon">
            {verificationStatus.status === 'approved' ? '✅' : 
             verificationStatus.status === 'pending' ? '⏳' : 
             verificationStatus.status === 'rejected' ? '❌' : '📝'}
          </div>
          
          <h2>Application Status: {verificationStatus.status.toUpperCase()}</h2>
          
          <div className="status-details">
            <p>Submitted on: {new Date(verificationStatus.createdAt).toLocaleDateString()}</p>
            
            {verificationStatus.status === 'approved' && (
              <div className="success-message">
                <p>Congratulations! You are now a verified guide.</p>
                <button onClick={() => navigate('/profile')} className="btn">
                  Go to Profile
                </button>
              </div>
            )}
            
            {verificationStatus.status === 'pending' && (
              <p className="info-message">
                Your application is under review. We'll notify you within 24-48 hours.
              </p>
            )}
            
            {verificationStatus.status === 'rejected' && (
              <div className="error-box">
                <p>Reason: {verificationStatus.review?.rejectionReason || 'Requirements not met'}</p>
                <button 
                  onClick={() => setVerificationStatus(null)} 
                  className="btn btn-primary"
                >
                  Apply Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🎯 Become a Verified Guide</h1>
        <p>Join our community of professional travel guides</p>
      </div>

      <form className="verification-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h3>👤 Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+880 1234567890"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nationality</label>
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
              >
                <option value="Bangladeshi">Bangladeshi</option>
                <option value="Indian">Indian</option>
                <option value="Pakistani">Pakistani</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Years of Experience *</label>
              <select
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleInputChange}
                required
              >
                <option value="">Select years</option>
                <option value="0">Less than 1 year</option>
                <option value="1">1-2 years</option>
                <option value="3">3-5 years</option>
                <option value="6">6-10 years</option>
                <option value="11">10+ years</option>
              </select>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="form-section">
          <h3>💼 Experience & Skills</h3>
          
          <div className="form-group">
            <label>Describe Your Experience *</label>
            <textarea
              name="experienceDescription"
              value={formData.experienceDescription}
              onChange={handleInputChange}
              placeholder="Tell us about your guiding experience, types of tours you've led, special skills..."
              rows="4"
              required
            />
            <small>{formData.experienceDescription.length}/500 characters</small>
          </div>

          <div className="form-group">
            <label>Languages Spoken</label>
            <input
              type="text"
              name="languages"
              value={formData.languages}
              onChange={handleInputChange}
              placeholder="e.g., Bengali, English, Hindi"
            />
          </div>

          <div className="form-group">
            <label>Specializations * (Select at least one)</label>
            <div className="checkbox-grid">
              {specializationOptions.map(spec => (
                <label key={spec.value} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.specializations.includes(spec.value)}
                    onChange={() => handleSpecializationChange(spec.value)}
                  />
                  <span>{spec.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Documents - REQUIRED */}
        <div className="form-section">
          <h3>📄 Required Documents</h3>
          <p className="section-note">All documents must be uploaded for verification</p>
          
          <div className="form-row">
            <div className="form-group">
              <label>ID Document Type *</label>
              <select
                name="idDocumentType"
                value={formData.idDocumentType}
                onChange={handleInputChange}
                required
              >
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
              </select>
            </div>

            <div className="form-group">
              <label>Upload ID Document * (Max 5MB)</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="idDocument"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'idDocument')}
                  required
                />
                <label htmlFor="idDocument" className="file-label">
                  {formData.idDocument ? '✅ Document Selected' : '📎 Choose File'}
                </label>
              </div>
              {formData.idDocumentPreview && (
                <div className="preview-container">
                  <img src={formData.idDocumentPreview} alt="ID Preview" />
                </div>
              )}
              {formData.idDocument && !formData.idDocumentPreview && (
                <p className="file-name">📄 {formData.idDocument.name}</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Profile Photo * (Max 5MB)</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="profilePhoto"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'profilePhoto')}
                  required
                />
                <label htmlFor="profilePhoto" className="file-label">
                  {formData.profilePhoto ? '✅ Photo Selected' : '📷 Choose Photo'}
                </label>
              </div>
              {formData.profilePhotoPreview && (
                <div className="preview-container">
                  <img src={formData.profilePhotoPreview} alt="Profile Preview" />
                </div>
              )}
              <small>A clear, professional photo for your guide profile</small>
            </div>

            <div className="form-group">
              <div className="document-requirements">
                <h4>Document Requirements:</h4>
                <ul>
                  <li>Clear, readable scans or photos</li>
                  <li>Valid and not expired</li>
                  <li>Full document visible</li>
                  <li>JPG, PNG, or PDF format</li>
                  <li>Maximum 5MB per file</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        {/* Submit Buttons */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/profile')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .container {
          max-width: 700px;
          margin: 0 auto;
          padding: 2rem;
        }

        .header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .header h1 {
          color: #2d7d32;
          margin-bottom: 0.5rem;
          font-size: 2rem;
        }

        .header p {
          color: #666;
          font-size: 1.1rem;
        }

        .verification-form {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .form-section h3 {
          color: #2d7d32;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .section-note {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          background: #fff3cd;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border-left: 4px solid #ffc107;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4caf50;
        }

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #666;
          font-size: 0.875rem;
        }

        /* File Upload Styles */
        .file-upload {
          position: relative;
        }

        .file-upload input[type="file"] {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .file-label {
          display: block;
          padding: 1rem;
          background: #f8f9fa;
          border: 2px dashed #dee2e6;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 500;
          color: #495057;
        }

        .file-label:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }

        .file-upload input:focus + .file-label {
          border-color: #4caf50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }

        .preview-container {
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .preview-container img {
          width: 100%;
          max-height: 200px;
          object-fit: cover;
        }

        .file-name {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
          color: #495057;
          font-size: 0.9rem;
        }

        .document-requirements {
          background: #f0f8ff;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #b8daff;
        }

        .document-requirements h4 {
          margin: 0 0 0.5rem 0;
          color: #004085;
          font-size: 0.95rem;
        }

        .document-requirements ul {
          margin: 0;
          padding-left: 1.5rem;
          font-size: 0.85rem;
          color: #004085;
        }

        .document-requirements li {
          margin: 0.25rem 0;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          background: #f9f9f9;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .checkbox-item:hover {
          background: #e8f5e8;
        }

        .checkbox-item input {
          margin-right: 0.5rem;
          width: auto;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .alert.error {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }

        .alert.success {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #2d7d32;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1b5e20;
        }

        .btn-secondary {
          background: #666;
          color: white;
        }

        .btn-secondary:hover {
          background: #555;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Status Card */
        .status-card {
          background: white;
          border-radius: 12px;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .status-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .status-card h2 {
          color: #2d7d32;
          margin-bottom: 2rem;
        }

        .status-details {
          max-width: 400px;
          margin: 0 auto;
        }

        .success-message {
          background: #e8f5e9;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .info-message {
          color: #1976d2;
          background: #e3f2fd;
          padding: 1rem;
          border-radius: 8px;
        }

        .error-box {
          background: #ffebee;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        /* Loading */
        .loading-box {
          text-align: center;
          padding: 4rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

        /* Responsive */
        @media (max-width: 640px) {
          .container {
            padding: 1rem;
          }

          .verification-form {
            padding: 1.5rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .checkbox-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
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

export default GuideVerification;
