import React, { useState, useEffect } from 'react';
import { Search, Filter, Bell, Settings, User, LogOut, Cpu, Database, Shield, Activity } from 'lucide-react';

const QuickActions = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const actions = [
    { icon: Cpu, label: 'System Status', color: 'var(--success)' },
    { icon: Database, label: 'Data Sources', color: 'var(--accent)' },
    { icon: Shield, label: 'Security Audit', color: 'var(--risk-medium)' },
    { icon: Activity, label: 'Live Metrics', color: '#8b5cf6' } // Keep purple for distinction
  ];

  return (
    <div className="quick-actions">
      {/* Search */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search solicitations, risks, requirements..."
          className="search-input"
        />
        <button className="search-filter">
          <Filter size={14} />
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="action-buttons">
        {actions.map((action, index) => (
          <button 
            key={index}
            className="action-btn"
            style={{ '--accent-color': action.color }}
            title={action.label}
          >
            <action.icon size={14} />
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="notifications">
        <button 
          className="notification-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell size={16} />
          {notifications > 0 && (
            <span className="notification-badge">{notifications}</span>
          )}
        </button>
        
        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h4>Notifications</h4>
              <button className="mark-all-read">Mark all read</button>
            </div>
            <div className="notification-list">
              <div className="notification-item unread">
                <div className="notification-icon" style={{ background: 'var(--risk-high)' }}>
                  <Shield size={12} fill="white" />
                </div>
                <div className="notification-content">
                  <p>High-risk compliance detected in DHA solicitation</p>
                  <span className="notification-time">2 minutes ago</span>
                </div>
              </div>
              <div className="notification-item unread">
                <div className="notification-icon" style={{ background: 'var(--success)' }}>
                  <Activity size={12} fill="white" />
                </div>
                <div className="notification-content">
                  <p>System analysis completed successfully</p>
                  <span className="notification-time">15 minutes ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon" style={{ background: 'var(--accent)' }}>
                  <Database size={12} fill="white" />
                </div>
                <div className="notification-content">
                  <p>New SAM.gov opportunities available</p>
                  <span className="notification-time">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="user-menu">
        <button className="user-btn">
          <User size={16} />
        </button>
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div>
              <div className="user-name">Analyst One</div>
              <div className="user-role">Security Level: SECRET</div>
            </div>
          </div>
          <div className="user-actions">
            <button className="user-action-btn">
              <Settings size={14} />
              <span>Settings</span>
            </button>
            <button className="user-action-btn">
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
