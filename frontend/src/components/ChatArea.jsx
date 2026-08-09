import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Check, CheckCheck, Trash2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function ChatArea({ 
  messages, 
  currentUser, 
  onSendMessage, 
  typingUsers, 
  onTyping, 
  onStopTyping, 
  isConnected,
  onMarkRead,
  onDeleteMessage
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive or typing status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle read receipts for incoming messages
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.username !== currentUser && msg.status === 'delivered') {
        onMarkRead(msg.id);
      }
    });
  }, [messages, currentUser, onMarkRead]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      
      // Stop typing immediately upon sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onStopTyping();
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    // Trigger typing event
    onTyping();

    // Clear previous timeout and set a new one to stop typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  // Cursor-sensitive emoji insertion
  const handleEmojiClick = (emojiData) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const emoji = emojiData.emoji;
    
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setInputText(newText);

    // Reposition cursor and refocus
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Format message timestamp
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-room-info">
          <div className="chat-title">Public Lobby</div>
          <div className="chat-subtitle">Real-time room for everyone</div>
        </div>
        <div className={`connection-indicator ${isConnected ? '' : 'disconnected'}`}>
          <span className="status-dot"></span>
          <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="messages-list">
        {messages.map((msg) => {
          const isSelf = msg.username === currentUser;
          return (
            <div 
              key={msg.id} 
              className={`message-wrapper ${isSelf ? 'outgoing' : 'incoming'}`}
            >
              {!isSelf && <div className="message-sender">{msg.username}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isSelf ? 'row-reverse' : 'row' }}>
                <div className="message-bubble">
                  {msg.text}
                  <div className="message-meta">
                    <span>{formatTime(msg.timestamp)}</span>
                    {isSelf && (
                      <span className="message-status-icon">
                        {msg.status === 'read' ? (
                          <CheckCheck size={14} style={{ color: '#818cf8' }} title="Read" />
                        ) : (
                          <Check size={14} style={{ color: '#94a3b8' }} title="Delivered" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {isSelf && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Delete this message?')) {
                        onDeleteMessage(msg.id);
                      }
                    }}
                    className="delete-message-btn"
                    title="Delete message"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dark)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dark)'}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="typing-wrapper">
            <div className="typing-bubble">
              <span className="typing-text">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
              </span>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container" style={{ position: 'relative' }}>
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="emoji-picker-wrapper">
            <EmojiPicker 
              theme="dark"
              onEmojiClick={handleEmojiClick}
              width="100%"
              height={320}
              searchPlaceHolder="Search emoji..."
              lazyLoadEmojis={true}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="input-form">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            disabled={!isConnected}
          />
          <div className="input-actions">
            <button 
              type="button" 
              className="action-btn" 
              onClick={() => setShowEmojiPicker(prev => !prev)}
              title="Add Emoji"
            >
              <Smile size={20} />
            </button>
            <button 
              type="submit" 
              className="send-btn" 
              disabled={!inputText.trim() || !isConnected}
              title="Send Message"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
