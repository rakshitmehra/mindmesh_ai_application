import './App.css';
import { useState, useRef, useEffect} from 'react';

import { makeRequest } from './api/api'
import SideMenu from './components/SideMenu/SideMenu'
import ChatMessage from './components/ChatMessage/ChatMessage'
import chatService from './components/Services/ChatService'

function App() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sideMenuOpen, setSideMenuOpen] = useState(false)
  const [chatLog, setChatLog] = useState([{
    user: "gpt",
    message: "Hello! How can I assist you today?"
  }])
  
  // New state additions
  const [isTyping, setIsTyping] = useState(false)
  const [messageCount, setMessageCount] = useState(1)
  const [currentTheme, setCurrentTheme] = useState('default')
  const [autoScroll, setAutoScroll] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [connectionStatus, setConnectionStatus] = useState('connected')
  
  // Chat management state
  const [allChats, setAllChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  
  const chatLogRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (chatLogRef.current && autoScroll) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog, autoScroll]);

  // Load all chats on component mount
  useEffect(() => {
    loadAllChats();
  },[]);

  // New typing indicator effect
  useEffect(() => {
    if (input.length > 0) {
      setIsTyping(true);
      setLastActivity(Date.now());
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [input]);

  // Activity monitoring effect
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      if (timeSinceActivity > 300000) {
        setConnectionStatus('idle');
      } else {
        setConnectionStatus('connected');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [lastActivity]);

  // Chat service functions
  const loadAllChats = async () => {
    try {
      const response = await chatService.getAllChats();
      if (response.success) {
        setAllChats(response.data);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      setConnectionStatus('error');
    }
  };

  const loadChatById = async (chatId) => {
    try {
      const response = await chatService.getChatById(chatId);
      if (response.success) {
        const chat = response.data;
        // Convert chat messages to your existing format
        const convertedMessages = chat.messages.map(msg => ({
          user: msg.role === 'user' ? 'me' : 'gemini',
          message: msg.content,
          timestamp: msg.timestamp,
          id: msg._id || Date.now()
        }));
        
        setChatLog(convertedMessages);
        setCurrentChatId(chatId);
        setMessageCount(convertedMessages.length);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
      setConnectionStatus('error');
    }
  };

  const createNewChat = async (firstMessage) => {
    try {
      const response = await chatService.createNewChat(firstMessage, 'New Chat', null);
      if (response.success) {
        const chat = response.data;
        setCurrentChatId(chat._id);
        setAllChats(prev => [chat, ...prev]);
        return chat;
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      setConnectionStatus('error');
      throw error;
    }
  };

  const addMessageToCurrentChat = async (message) => {
    if (!currentChatId) return;
    
    try {
      const response = await chatService.addMessageToChat(currentChatId, message);
      if (response.success) {
        // Update the chat in allChats list
        setAllChats(prev => prev.map(chat => 
          chat._id === currentChatId ? response.data.chat : chat
        ));
        return response.data;
      }
    } catch (error) {
      console.error('Failed to add message to chat:', error);
      setConnectionStatus('error');
      throw error;
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId);
      setAllChats(prev => prev.filter(chat => chat._id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setChatLog([{
          user: "gpt",
          message: "Hello! How can I assist you today?"
        }]);
        setMessageCount(1);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setConnectionStatus('error');
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setChatLog([{
      user: "gpt",
      message: "Hello! How can I assist you today?"
    }]);
    setMessageCount(1);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setLastActivity(Date.now());
    setConnectionStatus('connected');

    const newUserMessage = {
      user: 'me',
      message: userMessage,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    setChatLog(prev => [...prev, newUserMessage]);
    setMessageCount(prev => prev + 1);

    try {
      let chatId = currentChatId;
      
      // If no current chat, create a new one
      if (!chatId) {
        const newChat = await createNewChat(userMessage);
        chatId = newChat._id;
      } else {
        // Add message to existing chat
        await addMessageToCurrentChat(userMessage);
      }

      // Get AI response using your existing makeRequest
      const response = await makeRequest({ prompt: userMessage });
      const aiText = response.data;

      const newAiMessage = {
        user: 'gemini',
        message: aiText,
        timestamp: new Date().toISOString(),
        id: Date.now() + 1
      };

      setChatLog(prev => [...prev, newAiMessage]);
      setMessageCount(prev => prev + 1);

      // If we have a chat ID, add the AI response to the chat as well
      if (chatId) {
        await addMessageToCurrentChat(aiText);
        // Refresh the chats list to show updated title/timestamp
        loadAllChats();
      }

    } catch (error) {
      const errorMessage = {
        user: 'gemini',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        id: Date.now() + 1,
        isError: true
      };

      setChatLog(prev => [...prev, errorMessage]);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    setLastActivity(Date.now());
  };

  const exportChatHistory = () => {
    const chatData = {
      messages: chatLog,
      exportDate: new Date().toISOString(),
      messageCount: messageCount
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const toggleAutoScroll = () => {
    setAutoScroll(prev => !prev);
  };

  const changeTheme = (theme) => {
    setCurrentTheme(theme);
    document.body.className = `theme-${theme}`;
  };

  const handleScrollDetection = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    } else if (isAtBottom && !autoScroll) {
      setAutoScroll(true);
    }
  };

  return (
    <div className={`App theme-${currentTheme}`}>
      {sideMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSideMenuOpen(false)}
        />
      )}
      
      <SideMenu 
        isOpen={sideMenuOpen} 
        onToggle={() => setSideMenuOpen(!sideMenuOpen)}
        onExportChat={exportChatHistory}
        onThemeChange={changeTheme}
        currentTheme={currentTheme}
        messageCount={messageCount}
        allChats={allChats}
        currentChatId={currentChatId}
        onChatSelect={loadChatById}
        onChatDelete={deleteChat}
        onNewChat={startNewChat}
      />

      <section className='chatbox'>
        <div className='chat-header'>
          <button 
            className='mobile-menu-btn'
            onClick={() => setSideMenuOpen(true)}
          >
            ☰
          </button>
          <div className="header-content">
            <h2>Chat Assistant</h2>
            <div className="chat-status">
              <span className={`status-indicator ${connectionStatus}`}></span>
              <span className="message-counter">{messageCount} messages</span>
            </div>
          </div>
          
          <div className="header-controls">
            <button 
              className={`auto-scroll-btn ${autoScroll ? 'active' : ''}`}
              onClick={toggleAutoScroll}
              title="Toggle auto-scroll"
            >
              📜
            </button>
            <button 
              className="export-btn"
              onClick={exportChatHistory}
              title="Export chat history"
            >
              📥
            </button>
          </div>
        </div>

        <div 
          ref={chatLogRef}
          className='chat-log'
          onScroll={handleScrollDetection}
        >
          {chatLog.map((message, index) => (
            <ChatMessage 
              key={message.id || index} 
              message={message} 
              showTimestamp={true}
            />
          ))}
          
          {isLoading && (
            <div className="loading-message">
              <div className="loading-avatar">🤖</div>
              <div className="loading-content">
                <div className="loading-name">AI Assistant</div>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {!autoScroll && (
            <button 
              className="scroll-to-bottom-btn"
              onClick={() => {
                chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
                setAutoScroll(true);
              }}
            >
              ⬇️ Scroll to bottom
            </button>
          )}
        </div>

        <div className='chat-input-holder'>
          {isTyping && (
            <div className="typing-indicator">
              <span>You are typing...</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="input-container">
              <textarea
                ref={inputRef}
                rows='1'
                className='chat-input-textarea'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Type your message here...'
                autoComplete='off'
                disabled={isLoading}
                maxLength={2000}
              />
              <div className="input-controls">
                <span className="char-counter">
                  {input.length}/2000
                </span>
                <button
                  type="submit"
                  className="send-button"
                  disabled={!input.trim() || isLoading}
                >
                  ➤
                </button>
              </div>
            </div>
          </form>
          <p className="input-hint">
            Press Enter to send, Shift+Enter for new line
            {connectionStatus === 'idle' && ' • Connection idle'}
            {connectionStatus === 'error' && ' • Connection error'}
          </p>
        </div>
      </section>
    </div>
  );
}

export default App;