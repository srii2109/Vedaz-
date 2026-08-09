import React from 'react';
import { Users } from 'lucide-react';

export default function Sidebar({ currentUser, onlineUsers }) {
  // Get initials for avatar
  const getInitials = (name) => {
    return name ? name.slice(0, 2).toUpperCase() : '??';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-profile">
        <div className="avatar">
          {getInitials(currentUser)}
        </div>
        <div className="user-info">
          <div className="user-info-name" title={currentUser}>{currentUser}</div>
          <div className="status-badge">
            <span className="status-dot"></span>
            <span className="status-badge-text">Online</span>
          </div>
        </div>
      </div>
      
      <div className="online-users-section">
        <div className="online-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} />
            <span className="sidebar-title">Active Users</span>
          </span>
          <span className="online-count">{onlineUsers.length}</span>
        </div>
        
        <div className="online-users-list">
          {onlineUsers.map((user, idx) => {
            const isSelf = user === currentUser;
            return (
              <div key={idx} className={`user-item ${isSelf ? 'self' : ''}`}>
                <div className="user-avatar-small">
                  {getInitials(user)}
                </div>
                <div className="user-name" title={user}>
                  {user} {isSelf && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(You)</span>}
                </div>
                <span className="user-status-dot"></span>
              </div>
            );
          })}
          {onlineUsers.length === 0 && (
            <div style={{ color: 'var(--text-dark)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
              No active users
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
