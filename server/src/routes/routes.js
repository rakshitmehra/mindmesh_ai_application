const express = require('express')
const promptController = require('../controllers/prompt-controller')
const chatController = require('../controllers/chat-controller');
const routes = express.Router()

routes.post('/api/prompt', promptController.sendText)

routes.get('/api/chats', chatController.getChats);
routes.get('/api/chats/:chatId', chatController.getChatById);
routes.post('/api/chats', chatController.createChat);
routes.post('/api/chats/:chatId/messages', chatController.addMessage);
routes.put('/api/chats/:chatId/title', chatController.updateChatTitle);
routes.delete('/api/chats/:chatId', chatController.deleteChat);

module.exports = routes
