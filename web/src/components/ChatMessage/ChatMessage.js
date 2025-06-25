import './ChatMessage.css'

const ChatMessage = ({ message }) => {
  const isUser = message.user === 'me';
  const isAssistant = message.user === 'gpt' || message.user === 'gemini';
  
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="chat-message-center">
        <div className={`avatar ${isAssistant ? 'assistant' : 'user'}`}>
          {isUser ? '👤' : '🤖'}
        </div>
        <div className="message-content">
          <div className="message-header">
            {isUser ? 'You' : 'AI Assistant'}
          </div>
          <div className="message">
            {message.message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage