// frontend/src/pages/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { chatAPI } from '../services/api';
import { useSocket } from '../services/SocketContext';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef(null);
  
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const initChat = async () => {
      await loadChat();
      await loadMessages();
    };
    
    initChat();
  }, [chatId, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket && chat && isConnected) {
      // Join chat room
      socket.emit('joinChat', chatId);
      console.log('Joining chat room:', chatId);

      // Listen for new messages
      const handleNewMessage = (data) => {
        console.log('New message received:', data);
        if (data.chat === chatId || data.chatId === chatId) {
          setMessages(prev => [...prev, data.message || data]);
        }
      };

      // Listen for typing indicators
      const handleTyping = ({ chatId: typingChatId, userId, isTyping }) => {
        if (typingChatId === chatId && userId !== user._id) {
          setOtherUserTyping(isTyping);
        }
      };

      socket.on('newMessage', handleNewMessage);
      socket.on('typing', handleTyping);

      return () => {
        socket.emit('leaveChat', chatId);
        socket.off('newMessage', handleNewMessage);
        socket.off('typing', handleTyping);
      };
    }
  }, [socket, chat, chatId, user, isConnected]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      console.log('Loading chat details for:', chatId);
      const response = await chatAPI.getChatDetails(chatId);
      
      if (response.success) {
        setChat(response.data.chat);
        // Find the other participant
        const other = response.data.chat.participants.find(
          p => p.user._id !== user._id
        );
        setOtherUser(other?.user);
        console.log('Chat loaded successfully:', response.data.chat);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setError('Failed to load chat details');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('Loading messages for chat:', chatId);
      const response = await chatAPI.getChatMessages(chatId);
      
      if (response.success) {
        setMessages(response.data.messages || []);
        console.log('Messages loaded:', response.data.messages);
        // Mark messages as read
        await chatAPI.markAsRead(chatId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (typing) => {
    if (socket && isConnected) {
      socket.emit('typing', { chatId, isTyping: typing });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      console.log('Sending message:', newMessage);
      
      const response = await chatAPI.sendMessage(chatId, {
        content: newMessage.trim(),
        messageType: 'text'
      });

      if (response.success) {
        // Add message locally if not received via socket
        if (!socket || !isConnected) {
          setMessages(prev => [...prev, response.data.message]);
        }
        setNewMessage('');
        handleTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          Loading chat...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          {error}
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>
          <div className="chat-user-info">
            <h3>{otherUser?.name || 'Chat'}</h3>
            <div className="user-status">
              {otherUser?.isOnline && (
                <span className="online-status">● Online</span>
              )}
              {otherUserTyping && (
                <span className="typing-status">typing...</span>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isSender = message.sender?._id === user._id || message.sender === user._id;
                return (
                  <div
                    key={message._id || message.message_id || index}
                    className={`message ${isSender ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      {!isSender && (
                        <div className="message-sender">
                          {message.sender?.name || otherUser?.name}
                        </div>
                      )}
                      <p>{message.content}</p>
                      <span className="message-time">
                        {new Date(message.createdAt || message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="message-input-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value.length > 0 && !isTyping) {
                setIsTyping(true);
                handleTyping(true);
              } else if (e.target.value.length === 0 && isTyping) {
                setIsTyping(false);
                handleTyping(false);
              }
            }}
            onBlur={() => {
              if (isTyping) {
                setIsTyping(false);
                handleTyping(false);
              }
            }}
            placeholder="Type a message..."
            className="message-input"
            disabled={sending}
          />
          <button type="submit" className="send-btn" disabled={sending || !newMessage.trim()}>
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .chat-container {
          background: white;
          border-radius: 10px;
          height: 70vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          max-width: 800px;
          margin: 0 auto;
        }

        .chat-header {
          padding: 1rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #f9f9f9;
          border-radius: 10px 10px 0 0;
        }

        .back-btn {
          background: none;
          border: none;
          color: #2d7d32;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: #e8f5e8;
          border-radius: 5px;
        }

        .chat-user-info {
          flex: 1;
        }

        .chat-user-info h3 {
          margin: 0;
          color: #333;
        }

        .user-status {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .online-status {
          color: #4caf50;
          font-size: 0.875rem;
        }

        .typing-status {
          color: #666;
          font-size: 0.875rem;
          font-style: italic;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #fafafa;
          display: flex;
          flex-direction: column;
        }

        .empty-messages {
          text-align: center;
          color: #666;
          padding: 2rem;
          margin: auto;
        }

        .message {
          margin-bottom: 1rem;
          display: flex;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.sent {
          justify-content: flex-end;
        }

        .message.received {
          justify-content: flex-start;
        }

        .message-content {
          max-width: 70%;
          padding: 0.75rem 1rem;
          border-radius: 15px;
          position: relative;
        }

        .message-sender {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .message.sent .message-content {
          background: linear-gradient(135deg, #2d7d32, #4caf50);
          color: white;
          border-bottom-right-radius: 5px;
        }

        .message.received .message-content {
          background: white;
          color: #333;
          border-bottom-left-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .message-content p {
          margin: 0 0 0.25rem 0;
          word-wrap: break-word;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .message-input-form {
          padding: 1rem;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 0.5rem;
          background: white;
          border-radius: 0 0 10px 10px;
        }

        .message-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 25px;
          outline: none;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .message-input:focus {
          border-color: #4caf50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }

        .send-btn {
          padding: 0.75rem 1.5rem;
          background: #2d7d32;
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .send-btn:hover:not(:disabled) {
          background: #1b5e20;
          transform: translateY(-1px);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        @media (max-width: 768px) {
          .chat-container {
            height: 80vh;
            border-radius: 0;
          }

          .message-content {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
