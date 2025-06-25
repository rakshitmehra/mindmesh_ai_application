// server/controllers/chat-controller.js
const Chat = require('../models/Chat');
const gemini = require('../config/gemini');

module.exports = {
  // Get all chats for a user (or all chats if no userId)
  async getChats(req, res) {
    try {
      const { userId } = req.query;
      const filter = userId ? { userId, isActive: true } : { isActive: true };
      
      const chats = await Chat.find(filter)
        .select('_id title createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(50); // Limit to recent 50 chats
      
      return res.status(200).json({
        success: true,
        data: chats
      });
    } catch (error) {
      console.error('Error fetching chats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch chats'
      });
    }
  },

  // Get a specific chat with all messages
  async getChatById(req, res) {
    try {
      const { chatId } = req.params;
      
      const chat = await Chat.findById(chatId);
      
      if (!chat || !chat.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: chat
      });
    } catch (error) {
      console.error('Error fetching chat:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch chat'
      });
    }
  },

  // Create a new chat
  async createChat(req, res) {
    try {
      const { title, userId, prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }
      
      // Create chat with first user message
      const chat = new Chat({
        title: title || 'New Chat',
        userId: userId || null,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      // Get AI response using your existing gemini config
      const result = await gemini.textCompletion({ prompt });
      const aiResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      
      // Add AI response to messages
      chat.messages.push({
        role: 'assistant',
        content: aiResponse
      });
      
      await chat.save();
      
      return res.status(201).json({
        success: true,
        data: chat
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create chat'
      });
    }
  },

  // Add message to existing chat
  async addMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }
      
      const chat = await Chat.findById(chatId);
      
      if (!chat || !chat.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }
      
      // Add user message
      chat.messages.push({
        role: 'user',
        content: prompt
      });
      
      // Prepare conversation history for context
      const conversationHistory = chat.messages
        .slice(-10) // Take last 10 messages for context (to avoid token limits)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      
      // Create full prompt with context
      const fullPrompt = `Previous conversation:\n${conversationHistory}\n\nUser: ${prompt}`;
      
      // Get AI response with context using your existing gemini config
      const result = await gemini.textCompletion({ prompt: fullPrompt });
      const aiResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      
      // Add AI response
      chat.messages.push({
        role: 'assistant',
        content: aiResponse
      });
      
      chat.updatedAt = new Date();
      await chat.save();
      
      return res.status(200).json({
        success: true,
        data: {
          chat,
          newMessages: chat.messages.slice(-2) // Return last 2 messages (user + AI)
        }
      });
    } catch (error) {
      console.error('Error adding message:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add message'
      });
    }
  },

  // Update chat title
  async updateChatTitle(req, res) {
    try {
      const { chatId } = req.params;
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'Title is required'
        });
      }
      
      const chat = await Chat.findByIdAndUpdate(
        chatId,
        { title, updatedAt: new Date() },
        { new: true }
      );
      
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: { _id: chat._id, title: chat.title }
      });
    } catch (error) {
      console.error('Error updating chat title:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update chat title'
      });
    }
  },

  // Delete chat (soft delete)
  async deleteChat(req, res) {
    try {
      const { chatId } = req.params;
      
      const chat = await Chat.findByIdAndUpdate(
        chatId,
        { isActive: false },
        { new: true }
      );
      
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: 'Chat deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete chat'
      });
    }
  }
};