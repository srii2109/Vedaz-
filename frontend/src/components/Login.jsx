import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">
          <MessageSquare size={48} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#6366f1' }} />
          ChatWave
        </div>
        <p className="login-subtitle">Connect, chat, and share in real time</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label" htmlFor="username">Choose a Username</label>
            <input
              type="text"
              id="username"
              className="login-input"
              placeholder="e.g. alex_dev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              maxLength={20}
            />
          </div>
          <button type="submit" className="login-button">
            Enter Chatroom
          </button>
        </form>
      </div>
    </div>
  );
}
