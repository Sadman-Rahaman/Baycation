// frontend/src/pages/TripCollaboration.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useSocket } from '../services/SocketContext';
import { discussionAPI, tripAPI } from '../services/api';

const TripCollaboration = () => {
  const { tripId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { socket, isConnected, joinTrip, leaveTrip, sendMessage, updateTyping, addEventListener } = useSocket();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [discussion, setDiscussion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    loadTripAndDiscussion();
  }, [tripId, isAuthenticated, navigate]);

  useEffect(() => {
    if (trip && socket && isConnected) {
      // Join trip room for real-time updates
      joinTrip(tripId);
      
      // Set up event listeners
      const removeNewMessage = addEventListener('newMessage', handleNewMessage);
      const removeTypingStatus = addEventListener('typingStatus', handleTypingStatus);
      const removeUserJoined = addEventListener('userJoined', handleUserJoined);
      const removeUserLeft = addEventListener('userLeft', handleUserLeft);
      const removeUserActivity = addEventListener('userActivity', handleUserActivity);
      const removeUserOffline = addEventListener('userOffline', handleUserOffline);
      const removeItineraryUpdated = addEventListener('itineraryUpdated', handleItineraryUpdated);
      
      return () => {
        leaveTrip(tripId);
        removeNewMessage();
        removeTypingStatus();
        removeUserJoined();
        removeUserLeft();
        removeUserActivity();
        removeUserOffline();
        removeItineraryUpdated();
      };
    }
  }, [trip, socket, isConnected, tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadTripAndDiscussion = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load trip details
      const tripResponse = await tripAPI.getTrip(tripId);
      setTrip(tripResponse.data.trip);
      
      // Check if user has access to discussions
      const isOrganizer = tripResponse.data.trip.organizer._id === user?._id;
      const isParticipant = tripResponse.data.trip.participants.some(
        p => p.user._id === user?._id && p.status === 'confirmed'
      );
      
      if (!isOrganizer && !isParticipant) {
        setError('You need to be a participant or organizer to access trip collaboration features.');
        return;
      }
      
      if (!tripResponse.data.trip.collaborativeFeatures.allowDiscussions) {
        setError('Discussions are disabled for this trip.');
        return;
      }
      
      // Load discussion
      const discussionResponse = await discussionAPI.getDiscussion(tripId);
      setDiscussion(discussionResponse.data.discussion);
      setMessages(discussionResponse.data.discussion.messages || []);
      
    } catch (error) {
      console.error('Error loading trip and discussion:', error);
      setError('Failed to load trip collaboration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Socket event handlers
  const handleNewMessage = (data) => {
    if (data.tripId === tripId) {
      setMessages(prev => [...prev, data.message]);
      // Remove typing indicator for message author
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.message.author._id);
        return newSet;
      });
    }
  };

  const handleTypingStatus = (data) => {
    if (data.tripId === tripId && data.user._id !== user?._id) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.user._id);
        } else {
          newSet.delete(data.user._id);
        }
        return newSet;
      });
    }
  };

  const handleUserJoined = (data) => {
    if (data.trip._id === tripId) {
      setTrip(prev => ({ ...prev, ...data.trip }));
    }
  };

  const handleUserLeft = (data) => {
    if (data.trip._id === tripId) {
      setTrip(prev => ({ ...prev, ...data.trip }));
    }
  };

  const handleUserActivity = (data) => {
    if (data.tripId === tripId) {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.user._id, { ...data.user, lastSeen: data.lastSeen });
        return newMap;
      });
    }
  };

  const handleUserOffline = (data) => {
    if (data.tripId === tripId) {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.user._id);
        return newMap;
      });
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.user._id);
        return newSet;
      });
    }
  };

  const handleItineraryUpdated = (data) => {
    if (data.tripId === tripId) {
      setTrip(prev => ({ ...prev, itinerary: data.itinerary }));
      // Could show a notification here
      console.log(`Itinerary updated by ${data.updatedBy.name}`);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected) {
      return;
    }
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Send via socket for real-time delivery
    sendMessage(tripId, messageContent);
    
    // Also send via API as backup
    try {
      await discussionAPI.sendMessage(tripId, messageContent);
    } catch (error) {
      console.error('Error sending message via API:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTyping(tripId, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTyping(tripId, false);
    }, 1000);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getMessageIcon = (messageType) => {
    switch (messageType) {
      case 'system':
        return '🎯';
      case 'user_joined':
        return '👋';
      case 'user_left':
        return '👋';
      case 'itinerary_update':
        return '📋';
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          Loading collaboration space...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          {error}
        </div>
        <Link to={`/trips/${tripId}`} className="btn btn-primary">
          Back to Trip Details
        </Link>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Trip not found</h3>
          <p>The trip you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collaboration-container">
      {/* Header */}
      <div className="collaboration-header">
        <div className="trip-info">
          <Link to={`/trips/${tripId}`} className="back-link">
            ← Back to Trip
          </Link>
          <h1>{trip.title}</h1>
          <p>📍 {trip.destination}</p>
        </div>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </span>
        </div>
      </div>

      <div className="collaboration-layout">
        {/* Participants Sidebar */}
        <div className="participants-sidebar">
          <h3>Participants ({trip.currentParticipants})</h3>
          <div className="participants-list">
            {/* Organizer */}
            <div className="participant-item organizer">
              <div className="participant-info">
                <span className="participant-name">{trip.organizer.name}</span>
                <span className="participant-role">Organizer</span>
              </div>
              <div className="participant-status">
                {trip.organizer.isOnline && (
                  <span className="online-indicator">🟢</span>
                )}
              </div>
            </div>
            
            {/* Other Participants */}
            {trip.participants
              .filter(p => p.status === 'confirmed' && p.user._id !== trip.organizer._id)
              .map((participant) => (
              <div key={participant.user._id} className="participant-item">
                <div className="participant-info">
                  <span className="participant-name">{participant.user.name}</span>
                  <span className="participant-role">Participant</span>
                </div>
                <div className="participant-status">
                  {participant.user.isOnline && (
                    <span className="online-indicator">🟢</span>
                  )}
                  {typingUsers.has(participant.user._id) && (
                    <span className="typing-indicator">✏️</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          <div className="messages-container">
            {messages.map((message) => (
              <div 
                key={message.messageId} 
                className={`message ${message.messageType} ${message.author._id === user?._id ? 'own' : ''}`}
              >
                {message.messageType !== 'text' && (
                  <span className="message-icon">
                    {getMessageIcon(message.messageType)}
                  </span>
                )}
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">{message.author.name}</span>
                    <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                  </div>
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            ))}
            
            {/* Typing indicators */}
            {typingUsers.size > 0 && (
              <div className="typing-indicators">
                {Array.from(typingUsers).map(userId => {
                  const participant = trip.participants.find(p => p.user._id === userId)?.user ||
                                   (trip.organizer._id === userId ? trip.organizer : null);
                  return participant ? (
                    <div key={userId} className="typing-indicator">
                      <span>{participant.name} is typing...</span>
                      <div className="typing-animation">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="message-input-form">
            <div className="message-input-container">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder={`Message ${trip.title}...`}
                className="message-input"
                maxLength={1000}
                disabled={!isConnected}
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={!newMessage.trim() || !isConnected}
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Itinerary Sidebar */}
        <div className="itinerary-sidebar">
          <div className="sidebar-header">
            <h3>Quick Itinerary</h3>
            <Link to={`/trips/${tripId}`} className="btn btn-outline btn-small">
              Full View
            </Link>
          </div>
          
          <div className="quick-itinerary">
            {trip.itinerary && trip.itinerary.length > 0 ? (
              trip.itinerary.slice(0, 3).map((day) => (
                <div key={day.day} className="quick-day">
                  <h4>Day {day.day}</h4>
                  {day.activities.slice(0, 2).map((activity, index) => (
                    <div key={index} className="quick-activity">
                      <span className="activity-time">{activity.time}</span>
                      <span className="activity-name">{activity.activity}</span>
                    </div>
                  ))}
                  {day.activities.length > 2 && (
                    <div className="more-activities">
                      +{day.activities.length - 2} more activities
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-itinerary">
                <p>No itinerary created yet.</p>
                <Link to={`/trips/${tripId}`} className="btn btn-primary btn-small">
                  Create Itinerary
                </Link>
              </div>
            )}
            
            {trip.itinerary && trip.itinerary.length > 3 && (
              <div className="more-days">
                <Link to={`/trips/${tripId}`} className="btn btn-secondary btn-small">
                  View All {trip.itinerary.length} Days
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCollaboration;