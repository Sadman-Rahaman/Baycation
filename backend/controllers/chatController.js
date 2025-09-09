const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class ChatController {
  // Create or get direct chat
  static async createDirectChat(req, res) {
    try {
      const { participantId } = req.body;
      const userId = req.user.userId;

      console.log('Creating/Getting direct chat between:', userId, 'and', participantId);

      if (!participantId) {
        return res.status(400).json({
          success: false,
          message: 'Participant ID is required'
        });
      }

      if (participantId === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create chat with yourself'
        });
      }

      // Check if participant exists
      const participant = await User.findById(participantId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if direct chat already exists
      let chat = await Chat.findOne({
        chatType: 'direct',
        'participants.user': { $all: [userId, participantId] }
      }).populate('participants.user', 'name email isOnline bio location');

      if (chat) {
        console.log('Existing chat found:', chat._id);
        return res.json({
          success: true,
          message: 'Chat already exists',
          data: { chat }
        });
      }

      // Get current user for role
      const currentUser = await User.findById(userId);

      // Create new direct chat
      chat = new Chat({
        chat_id: uuidv4(),
        chatType: 'direct',
        participants: [
          { 
            user: userId, 
            role: currentUser.role || 'traveler'
          },
          { 
            user: participantId, 
            role: participant.role || 'traveler'
          }
        ],
        isActive: true
      });

      await chat.save();
      await chat.populate('participants.user', 'name email isOnline bio location');

      console.log('New chat created:', chat._id);

      res.status(201).json({
        success: true,
        message: 'Chat created successfully',
        data: { chat }
      });
    } catch (error) {
      console.error('Create direct chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating chat',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get chat details by ID
  static async getChatDetails(req, res) {
    try {
      const { chatId } = req.params;
      const userId = req.user.userId;

      console.log('Getting chat details for:', chatId, 'User:', userId);

      const chat = await Chat.findById(chatId)
        .populate('participants.user', 'name email isOnline bio location');

      if (!chat) {
        console.log('Chat not found:', chatId);
        return res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
      }

      // Check if user is a participant
      const isParticipant = chat.participants.some(p => {
        // Handle both populated and non-populated cases
        const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantUserId === userId;
      });

      if (!isParticipant) {
        console.log('User not a participant in this chat');
        return res.status(403).json({
          success: false,
          message: 'Access denied to this chat'
        });
      }

      console.log('Chat details fetched successfully');

      res.json({
        success: true,
        data: { chat }
      });
    } catch (error) {
      console.error('Get chat details error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching chat details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user's chats
  static async getUserChats(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const chats = await Chat.find({
        'participants.user': userId,
        isActive: true
      })
        .populate('participants.user', 'name email isOnline')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'name'
          }
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Chat.countDocuments({
        'participants.user': userId,
        isActive: true
      });

      res.json({
        success: true,
        data: {
          chats,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: chats.length,
            totalChats: total
          }
        }
      });
    } catch (error) {
      console.error('Get user chats error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching chats'
      });
    }
  }

  // Get chat messages
  static async getChatMessages(req, res) {
    try {
      const { chatId } = req.params;
      const userId = req.user.userId;
      const { page = 1, limit = 50 } = req.query;

      console.log('Getting messages for chat:', chatId, 'User:', userId);

      // Verify chat exists
      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.log('Chat not found:', chatId);
        return res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
      }

      // Verify user is participant
      const isParticipant = chat.participants.some(
        p => p.user.toString() === userId
      );

      if (!isParticipant) {
        console.log('User not a participant');
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const messages = await Message.find({ 
        chat: chatId,
        isDeleted: false
      })
        .populate('sender', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Message.countDocuments({ 
        chat: chatId,
        isDeleted: false
      });

      console.log(`Found ${messages.length} messages`);

      res.json({
        success: true,
        data: {
          messages: messages.reverse(), // Return in chronological order
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: messages.length,
            totalMessages: total
          }
        }
      });
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching messages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Send message
  static async sendMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { content, messageType = 'text' } = req.body;
      const senderId = req.user.userId;

      console.log('Sending message to chat:', chatId);

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      // Verify user is participant and chat exists
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
      }

      const isParticipant = chat.participants.some(
        p => p.user.toString() === senderId
      );

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Create message
      const message = new Message({
        message_id: uuidv4(),
        chat: chatId,
        sender: senderId,
        content: content.trim(),
        messageType
      });

      await message.save();
      await message.populate('sender', 'name email');

      // Update chat's last message and activity
      chat.lastMessage = {
        content: message.content,
        sender: senderId,
        timestamp: new Date(),
        messageType
      };
      chat.updatedAt = new Date();
      
      // Update unread count for other participants
      chat.participants.forEach(participant => {
        if (participant.user.toString() !== senderId) {
          const currentCount = chat.unreadCount.get(participant.user.toString()) || 0;
          chat.unreadCount.set(participant.user.toString(), currentCount + 1);
        }
      });
      
      await chat.save();

      // Emit socket event if available
      const io = req.app.get('io');
      if (io) {
        // Emit to all participants in the chat
        chat.participants.forEach(participant => {
          if (participant.user.toString() !== senderId) {
            io.to(`user-${participant.user}`).emit('newMessage', {
              chatId,
              message
            });
          }
        });
      }

      console.log('Message sent successfully');

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while sending message',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mark messages as read
  static async markAsRead(req, res) {
    try {
      const { chatId } = req.params;
      const userId = req.user.userId;

      console.log('Marking messages as read for chat:', chatId);

      // Update all unread messages in this chat
      await Message.updateMany(
        {
          chat: chatId,
          sender: { $ne: userId },
          'readBy.user': { $ne: userId }
        },
        {
          $addToSet: { 
            readBy: { 
              user: userId, 
              readAt: new Date() 
            } 
          }
        }
      );

      // Reset unread count in chat
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.unreadCount.set(userId, 0);
        await chat.save();
      }

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while marking messages as read'
      });
    }
  }

  // Delete message (soft delete)
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;

      const message = await Message.findById(messageId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Only sender can delete their message
      if (message.sender.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the sender can delete this message'
        });
      }

      // Soft delete - mark as deleted
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting message'
      });
    }
  }

  // Get Q&A messages for a trip
  static async getQAMessages(req, res) {
    try {
      const { tripId } = req.params;
      const { page = 1, limit = 20, answered = 'all' } = req.query;

      let query = {
        trip: tripId,
        messageType: 'question'
      };

      if (answered !== 'all') {
        query['metadata.isAnswered'] = answered === 'true';
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const messages = await Message.find(query)
        .populate('sender', 'name email')
        .populate('metadata.answeredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Message.countDocuments(query);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: messages.length,
            totalMessages: total
          }
        }
      });
    } catch (error) {
      console.error('Get Q&A messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching Q&A messages'
      });
    }
  }

  // Answer a question
  static async answerQuestion(req, res) {
    try {
      const { messageId } = req.params;
      const { answer } = req.body;
      const userId = req.user.userId;

      if (!answer || answer.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Answer is required'
        });
      }

      const message = await Message.findById(messageId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      if (message.messageType !== 'question') {
        return res.status(400).json({
          success: false,
          message: 'This message is not a question'
        });
      }

      if (message.metadata.isAnswered) {
        return res.status(400).json({
          success: false,
          message: 'This question has already been answered'
        });
      }

      // Create answer message
      const answerMessage = new Message({
        message_id: uuidv4(),
        chat: message.chat,
        sender: userId,
        content: answer.trim(),
        messageType: 'answer',
        replyTo: messageId,
        metadata: {
          isAnswer: true
        }
      });

      await answerMessage.save();

      // Update original question
      message.metadata.isAnswered = true;
      message.metadata.answeredBy = userId;
      message.metadata.answeredAt = new Date();
      await message.save();

      await answerMessage.populate('sender', 'name email');

      res.json({
        success: true,
        message: 'Question answered successfully',
        data: { message: answerMessage }
      });
    } catch (error) {
      console.error('Answer question error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while answering question'
      });
    }
  }
}

module.exports = ChatController;
