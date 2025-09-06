// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useSocket } from '../services/SocketContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.email === 'admin@gmail.com');

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="logo">
          <div className="logo-container">
            <img src="/baycation-logo.png" alt="Baycation" className="logo-icon" />
            <span className="logo-text">BAYCATION</span>
          </div>
        </Link>
        
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          
          {isAuthenticated ? (
            isAdmin ? (
              <>
                <Link 
                  to="/trips" 
                  className={`nav-link ${isActive('/trips') ? 'active' : ''}`}
                >
                  Browse Trips
                </Link>
                <Link 
                  to="/admin" 
                  className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  Admin Dashboard
                </Link>
                <button onClick={logout} className="logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/trips" 
                  className={`nav-link ${isActive('/trips') ? 'active' : ''}`}
                >
                  Browse Trips
                </Link>
                <Link 
                  to="/find-buddies" 
                  className={`nav-link ${isActive('/find-buddies') ? 'active' : ''}`}
                >
                  Find Buddies
                </Link>
                <Link 
                  to="/my-trips" 
                  className={`nav-link ${isActive('/my-trips') ? 'active' : ''}`}
                >
                  My Trips
                </Link>
                <Link 
                  to="/stories" 
                  className={`nav-link ${isActive('/stories') ? 'active' : ''}`}
                >
                  Stories
                </Link>
                <Link 
                  to="/marketplace" 
                  className={`nav-link ${isActive('/marketplace') ? 'active' : ''}`}
                >
                  Marketplace
                </Link>
                {user?.role === 'guide' && (
                  <Link 
                    to="/guide-verification" 
                    className={`nav-link ${isActive('/guide-verification') ? 'active' : ''}`}
                  >
                    Verification
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                >
                  Profile
                  {user?.isOnline && (
                    <span style={{ 
                      marginLeft: '0.5rem',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#4caf50',
                      display: 'inline-block'
                    }}></span>
                  )}
                </Link>
                <button onClick={logout} className="logout-btn">
                  Logout
                </button>
              </>
            )
          ) : (
            <>
              <Link 
                to="/trips" 
                className={`nav-link ${isActive('/trips') ? 'active' : ''}`}
              >
                Browse Trips
              </Link>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className={`nav-link ${isActive('/register') ? 'active' : ''}`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Add custom styles for the updated logo layout */}
      <style jsx>{`
        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 8px;
        }

        .logo-text {
          font-size: 1.2rem;
          font-weight: bold;
          letter-spacing: 0.5px;
        }

        .logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: white;
          transition: transform 0.3s ease;
        }

        .logo:hover {
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .logo-container {
            flex-direction: row;
            gap: 0.5rem;
          }

          .logo-icon {
            width: 32px;
            height: 32px;
          }

          .logo-text {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
