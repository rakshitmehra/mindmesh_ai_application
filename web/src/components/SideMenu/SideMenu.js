import React, { useState } from 'react';
import './SideMenu.css';

const SideMenu = ({
  isOpen,
  onToggle,
  messageCount,
  allChats = [],
  currentChatId,
  onChatSelect,
  onChatDelete,
  onNewChat
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const truncateTitle = (title, maxLength = 25) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();
    setShowDeleteConfirm(chatId);
  };

  const confirmDelete = (chatId) => {
    onChatDelete(chatId);
    setShowDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className={`sidemenu ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="sidemenu-header">
        <h2>MindMesh</h2>
        <button className="close-btn" onClick={onToggle}>
          ✕
        </button>

      </div>

      {/* New Chat Button */}
      <div className="new-chat-section">
        <button className="new-chat-btn" onClick={onNewChat}>
          <span>➕</span>
          New Chat
        </button>
      </div>

      {/* Previous Chats */}
      <div className="chats-section">
        <h3>Previous Chats</h3>
        <div className="chat-list">
          {allChats.length === 0 ? (
            <div className="no-chats">
              <p>No previous chats</p>
              <small>Your conversations will appear here</small>
            </div>
          ) : (
            allChats.map((chat) => (
              <div key={chat._id} className="chat-item-wrapper">
                <div
                  className={`chat-item ${currentChatId === chat._id ? 'active' : ''}`}
                  onClick={() => onChatSelect(chat._id)}
                >
                  <div className="chat-content">
                    <div className="chat-title">
                      {truncateTitle(chat.title || 'Untitled Chat')}
                    </div>
                    <div className="chat-info">
                      <span className="chat-date">
                        {formatDate(chat.updatedAt || chat.createdAt)}
                      </span>
                      <span className="message-count">
                        {chat.messages?.length || 0} messages
                      </span>
                    </div>
                    {chat.messages && chat.messages.length > 0 && (
                      <div className="chat-preview">
                        {truncateTitle(chat.messages[chat.messages.length - 1]?.content || '', 40)}
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteClick(e, chat._id)}
                    title="Delete chat"
                  >
                    🗑️
                  </button>
                </div>

                {showDeleteConfirm === chat._id && (
                  <div className="delete-confirm">
                    <p>Delete this chat permanently?</p>
                    <div className="confirm-buttons">
                      <button 
                        className="confirm-yes" 
                        onClick={() => confirmDelete(chat._id)}
                      >
                        Delete
                      </button>
                      <button 
                        className="confirm-no" 
                        onClick={cancelDelete}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settings & Actions */}
      <div className="sidemenu-footer">
        <div className="stats">
          <div className="stat-item">
            <span>Current Chat:</span>
            <span>{messageCount} messages</span>
          </div>
          <div className="stat-item">
            <span>Total Chats:</span>
            <span>{allChats.length}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SideMenu;