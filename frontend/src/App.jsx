import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin);

export default function App() {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('chat_username') || '';
  });
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef(null);

  // Initialize socket connection and event handlers
  useEffect(() => {
    if (!username) return;

    // Fetch initial chat history
    fetch(`${BACKEND_URL}/api/messages`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch messages');
        return res.json();
      })
      .then(data => setMessages(data))
      .catch(err => console.error('Error fetching history:', err));

    // Connect socket
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join', username);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for new messages
    socketRef.current.on('message', (message) => {
      setMessages(prev => {
        // Prevent duplicate messages if any
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    // Listen for online users updates
    socketRef.current.on('users', (users) => {
      setOnlineUsers(users);
    });

    // Listen for typing events
    socketRef.current.on('typing', (user) => {
      setTypingUsers(prev => {
        if (prev.includes(user)) return prev;
        return [...prev, user];
      });
    });

    socketRef.current.on('stop-typing', (user) => {
      setTypingUsers(prev => prev.filter(u => u !== user));
    });

    // Listen for message status updates (e.g. read status)
    socketRef.current.on('message-status', ({ id, status }) => {
      setMessages(prev => 
        prev.map(msg => msg.id === id ? { ...msg, status } : msg)
      );
    });

    // Listen for message deletion
    socketRef.current.on('message-delete', (id) => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [username]);

  const handleLogin = (selectedUsername) => {
    localStorage.setItem('chat_username', selectedUsername);
    setUsername(selectedUsername);
  };

  // REST API: Send message
  const handleSendMessage = async (text) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          text
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message over REST API');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  // Socket: Emit typing event
  const handleTyping = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', username);
    }
  };

  // Socket: Emit stop typing event
  const handleStopTyping = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stop-typing', username);
    }
  };

  // Socket: Emit read status update
  const handleMarkRead = (messageId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message-read', { messageId, username });
    }
  };

  // REST API: Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message. Please try again.');
    }
  };

  if (!username) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        currentUser={username} 
        onlineUsers={onlineUsers} 
      />
      <ChatArea 
        messages={messages} 
        currentUser={username} 
        onSendMessage={handleSendMessage}
        typingUsers={typingUsers.filter(u => u !== username)}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        isConnected={isConnected}
        onMarkRead={handleMarkRead}
        onDeleteMessage={handleDeleteMessage}
      />
    </div>
  );
}
