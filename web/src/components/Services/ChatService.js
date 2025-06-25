// src/services/chatService.js
const API_BASE_URL = 'http://localhost:5000/api';

class ChatService {
  async getAllChats(userId = null) {
    try {
      const url = userId ? `${API_BASE_URL}/chats?userId=${userId}` : `${API_BASE_URL}/chats`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  async getChatById(chatId) {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  }

  async createNewChat(message, title = 'New Chat', userId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          userId,
          prompt: message  // Changed from 'message' to 'prompt' to match your backend
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  async addMessageToChat(chatId, message) {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: message })  // Changed from 'message' to 'prompt'
      });
      
      if (!response.ok) {
        throw new Error('Failed to add message');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  async updateChatTitle(chatId, title) {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  }

  async deleteChat(chatId) {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;