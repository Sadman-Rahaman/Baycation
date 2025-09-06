// frontend/src/services/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [activeTrips, setActiveTrips] = useState(new Set());

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      const newSocket = io('http://localhost:5002', {
        auth: {
          token: localStorage.getItem('token')
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Global events
      newSocket.on('tripCreated', (data) => {
        console.log('New trip created:', data);
        // Could trigger a notification or update trip lists
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers(new Map());
      setActiveTrips(new Set());
    }
  }, [isAuthenticated, user]);

  // Socket helper functions
  const joinTrip = (tripId) => {
    if (socket && isConnected) {
      socket.emit('joinTrip', tripId);
      setActiveTrips(prev => new Set([...prev, tripId]));
    }
  };

  const leaveTrip = (tripId) => {
    if (socket && isConnected) {
      socket.emit('leaveTrip', tripId);
      setActiveTrips(prev => {
        const newSet = new Set(prev);
        newSet.delete(tripId);
        return newSet;
      });
    }
  };

  const sendMessage = (tripId, content, messageType = 'text') => {
    if (socket && isConnected) {
      socket.emit('sendMessage', { tripId, content, messageType });
    }
  };

  const updateTyping = (tripId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { tripId, isTyping });
    }
  };

  const updateItinerary = (tripId, itinerary, changeInfo) => {
    if (socket && isConnected) {
      socket.emit('updateItinerary', { tripId, itinerary, changeInfo });
    }
  };

  const updateActivity = (tripId) => {
    if (socket && isConnected) {
      socket.emit('updateActivity', { tripId });
    }
  };

  // Event listeners management
  const addEventListener = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };

  const removeEventListener = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    activeTrips,
    joinTrip,
    leaveTrip,
    sendMessage,
    updateTyping,
    updateItinerary,
    updateActivity,
    addEventListener,
    removeEventListener
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
