import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { tripAPI, userAPI, adminAPI, guideVerificationAPI } from '../services/api';

const AdminDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const [pendingTrips, setPendingTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.email === 'admin@gmail.com');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const resp = await tripAPI.getPendingTrips();
        const trips = resp?.data?.trips || resp?.data?.data?.trips || resp?.trips || [];
        setPendingTrips(Array.isArray(trips) ? trips : []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        // Try public first for reliability, then fallback to admin endpoint
        let resp = await userAPI.listAllPublic();
        let list = resp?.data?.users || resp?.data?.data?.users || resp?.users;
        if (!Array.isArray(list)) {
          resp = await userAPI.listUsers();
          list = resp?.data?.users || resp?.data?.data?.users || resp?.users || [];
        }
        setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load users');
      } finally {
        setUsersLoading(false);
      }
    };
    const loadVerifications = async () => {
      try {
        setVerificationsLoading(true);
        const resp = await guideVerificationAPI.getAllVerifications({ status: 'pending' });
        setVerifications(resp?.data?.verifications || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load verifications');
      } finally {
        setVerificationsLoading(false);
      }
    };
    const loadDashboardStats = async () => {
      try {
        const resp = await adminAPI.getDashboardStats();
        setDashboardStats(resp?.data || null);
      } catch (e) {
        console.error('Failed to load dashboard stats:', e);
      }
    };
    if (isAdmin) {
      loadData();
      loadUsers();
      loadVerifications();
      loadDashboardStats();
    }
  }, [isAdmin]);

  const approveTrip = async (tripId) => {
    try {
      await tripAPI.approveTrip(tripId);
      setPendingTrips(prev => prev.filter(t => t._id !== tripId));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to approve trip');
    }
  };

  const promote = async (userId) => {
    try {
      await userAPI.promote(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: 'admin' } : u));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to promote user');
    }
  };

  const demote = async (userId) => {
    try {
      await userAPI.demote(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: 'traveler' } : u));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to demote user');
    }
  };

  const removeUser = async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to remove user');
    }
  };

  const reviewVerification = async (verificationId, status, comments) => {
    try {
      await guideVerificationAPI.reviewVerification(verificationId, {
        status,
        comments
      });
      setVerifications(prev => prev.filter(v => v._id !== verificationId));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to review verification');
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="alert alert-error">Admin access required.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage platform content, users, and analytics</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          Pending Trips
        </button>
        <button
          className={`tab ${activeTab === 'verifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('verifications')}
        >
          Guide Verifications
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="admin-overview">
          {dashboardStats && (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <div className="stat-number">{dashboardStats.overview?.totalUsers || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Total Trips</h3>
                <div className="stat-number">{dashboardStats.overview?.totalTrips || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Gear Listings</h3>
                <div className="stat-number">{dashboardStats.overview?.totalGear || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Total Orders</h3>
                <div className="stat-number">{dashboardStats.overview?.totalOrders || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Pending Verifications</h3>
                <div className="stat-number">{dashboardStats.overview?.pendingVerifications || 0}</div>
              </div>
            </div>
          )}

          <div className="card">
            <h2>Recent Activity</h2>
            {dashboardStats?.recentActivity?.length > 0 ? (
              <div className="activity-list">
                {dashboardStats.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <span className="activity-user">{activity.name}</span>
                    <span className="activity-role">{activity.role}</span>
                    <span className="activity-date">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent activity</p>
            )}
          </div>
        </div>
      )}

      {/* Pending Trips Tab */}
      {activeTab === 'trips' && (
        <div className="card">
          <h2>Pending Trips</h2>
          {loading ? (
            <div className="loading"><div className="spinner"></div>Loading...</div>
          ) : pendingTrips.length === 0 ? (
            <div className="empty-state">
              <h3>No pending trips</h3>
            </div>
          ) : (
            <div className="grid grid-2">
              {pendingTrips.map(trip => (
                <div key={trip._id} className="trip-card">
                  <div className="trip-header">
                    <div>
                      <h3 className="trip-title">{trip.title}</h3>
                      <p className="trip-destination">📍 {trip.destination}</p>
                    </div>
                    <span className={`trip-status ${trip.status}`}>{trip.status}</span>
                  </div>
                  <div className="trip-description">{trip.description}</div>
                  <div className="btn-group">
                    <Link to={`/trips/${trip._id}`} className="btn btn-outline btn-small">View</Link>
                    <button onClick={() => approveTrip(trip._id)} className="btn btn-primary btn-small">Approve</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guide Verifications Tab */}
      {activeTab === 'verifications' && (
        <div className="card">
          <h2>Guide Verification Requests</h2>
          {verificationsLoading ? (
            <div className="loading"><div className="spinner"></div>Loading...</div>
          ) : verifications.length === 0 ? (
            <div className="empty-state">
              <h3>No pending verifications</h3>
            </div>
          ) : (
            <div className="grid grid-2">
              {verifications.map(verification => (
                <div key={verification._id} className="verification-card">
                  <div className="verification-header">
                    <div>
                      <h3 className="verification-name">{verification.personalInfo?.fullName}</h3>
                      <p className="verification-email">{verification.applicant?.email}</p>
                    </div>
                    <span className={`verification-status ${verification.status}`}>
                      {verification.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="verification-details">
                    <p><strong>Experience:</strong> {verification.professionalInfo?.experience?.years} years</p>
                    <p><strong>Nationality:</strong> {verification.personalInfo?.nationality}</p>
                    <p><strong>Phone:</strong> {verification.personalInfo?.phone}</p>
                    <p><strong>Specializations:</strong> {verification.professionalInfo?.specializations?.join(', ')}</p>
                  </div>
                  <div className="btn-group">
                    <button 
                      onClick={() => reviewVerification(verification._id, 'approved', 'Verification approved')}
                      className="btn btn-primary btn-small"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => reviewVerification(verification._id, 'rejected', 'Verification rejected')}
                      className="btn btn-danger btn-small"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h2>Users</h2>
          {usersLoading ? (
            <div className="loading"><div className="spinner"></div>Loading...</div>
          ) : users.length === 0 ? (
            <div className="empty-state"><h3>No users found</h3></div>
          ) : (
            <div className="grid grid-2">
              {users.map(u => (
                <div key={u._id} className="traveler-card">
                  <div className="traveler-header">
                    <div className="traveler-info">
                      <h3>{u.name}</h3>
                      <p>{u.email}</p>
                    </div>
                    <span className="traveler-role">{u.role}</span>
                  </div>
                  <div className="traveler-stats">
                    <span>{u.location || 'Unknown location'}</span>
                    <span>{u.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  <div className="btn-group">
                    {u.role !== 'admin' ? (
                      <button onClick={() => promote(u._id)} className="btn btn-primary btn-small">Promote</button>
                    ) : (
                      <button onClick={() => demote(u._id)} className="btn btn-secondary btn-small">Demote</button>
                    )}
                    {u._id === user?._id ? (
                      <button onClick={() => removeUser(u._id)} className="btn btn-danger btn-small">Delete My Account</button>
                    ) : (
                      <button onClick={() => removeUser(u._id)} className="btn btn-danger btn-small">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


