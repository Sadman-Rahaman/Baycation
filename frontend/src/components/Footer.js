// frontend/src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img src="/baycation-logo.png" alt="Baycation" className="footer-logo large" />
          <div>
            <h3>Baycation</h3>
            <p>Just a smile away</p>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/trips">Browse Trips</Link>
            <Link to="/find-buddies">Find Buddies</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/profile">Profile</Link>
          </div>
        </div>

        <div className="footer-features-block">
          <h4>🌟 Features Available Now</h4>
          <ul>
            <li>User Profiles</li>
            <li>Travel Buddy Search</li>
            <li>Trip Planning</li>
            <li>Group Collaboration</li>
            <li>Trip Management</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {year} Baycation. All rights reserved.</span>
        <span>Made with ❤️ for travelers.</span>
      </div>
    </footer>
  );
};

export default Footer;


