// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext';
import { SocketProvider } from './services/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import FindBuddies from './pages/FindBuddies';
import TravelerProfile from './pages/TravelerProfile';
import Trips from './pages/Trips';
import CreateTrip from './pages/CreateTrip';
import TripDetails from './pages/TripDetails';
import MyTrips from './pages/MyTrips';
import AdminDashboard from './pages/AdminDashboard';
import Stories from './pages/Stories';
import Marketplace from './pages/Marketplace';
import GuideVerification from './pages/GuideVerification';
import Chat from './pages/Chat';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/find-buddies" element={<FindBuddies />} />
                <Route path="/traveler/:travelerId" element={<TravelerProfile />} />
                <Route path="/trips" element={<Trips />} />
                <Route path="/trips/create" element={<CreateTrip />} />
                <Route path="/trips/:tripId" element={<TripDetails />} />
                <Route path="/my-trips" element={<MyTrips />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/guide-verification" element={<GuideVerification />} />
                <Route path="/chat/:chatId" element={<Chat />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
