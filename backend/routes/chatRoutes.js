// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Create or get direct chat
router.post('/direct', auth, ChatController.createDirectChat);

// Get user's chats - MUST BE BEFORE /:chatId
router.get('/user/chats', auth, ChatController.getUserChats);

// Get Q&A messages - MUST BE BEFORE /:chatId
router.get('/qa/:tripId', auth, ChatController.getQAMessages);

// Get chat details - ADD THIS ROUTE
router.get('/:chatId', auth, ChatController.getChatDetails);

// Get chat messages
router.get('/:chatId/messages', auth, ChatController.getChatMessages);

// Send message
router.post('/:chatId/messages', auth, ChatController.sendMessage);

// Mark messages as read
router.put('/:chatId/read', auth, ChatController.markAsRead);

// Delete message
router.delete('/messages/:messageId', auth, ChatController.deleteMessage);

// Answer question
router.post('/messages/:messageId/answer', auth, ChatController.answerQuestion);

module.exports = router;
