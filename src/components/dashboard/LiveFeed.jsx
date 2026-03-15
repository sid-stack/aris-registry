import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle, Zap, Target, Award, Globe } from 'lucide-react';

const LiveFeed = () => {
  const [feedItems, setFeedItems] = useState([
    {
      id: 1,
      type: 'opportunity',
      title: 'VA Cloud Modernization II',
      agency: 'Department of Veterans Affairs',
      value: '$45.2M',
      deadline: '2024-04-15',
      risk: 'Medium',
      timestamp: new Date(Date.now() - 5 * 60000),
      icon: Globe,
      color: 'var(--accent)'
    },
    {
      id: 2,
      type: 'alert',
      title: 'Compliance Risk Detected',
      agency: 'DHA Video Imaging Archive',
      value: 'High Risk',
      deadline: 'Immediate',
      risk: 'High',
      timestamp: new Date(Date.now() - 12 * 60000),
      icon: AlertTriangle,
      color: 'var(--risk-high)'
    },
    {
      id: 3,
      type: 'success',
      title: 'Analysis Complete',
      agency: 'NASA Imaging Pipeline',
      value: '78/100 Score',
      deadline: 'Completed',
      risk: 'Low',
      timestamp: new Date(Date.now() - 28 * 60000),
      icon: CheckCircle,
      color: 'var(--success)'
    },
    {
      id: 4,
      type: 'opportunity',
      title: 'GSA Data Analytics Platform',
      agency: 'General Services Administration',
      value: '$28.7M',
      deadline: '2024-04-22',
      risk: 'Low',
      timestamp: new Date(Date.now() - 45 * 60000),
      icon: Target,
      color: 'var(--accent)'
    }
  ]);

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Simulate new feed items
      const newItemTypes = [
        {
          type: 'opportunity',
          title: 'DHS Cybersecurity Assessment',
          agency: 'Homeland Security',
          value: '$67.3M',
          deadline: '2024-05-01',
          risk: 'Medium',
          icon: Globe,
          color: '#3b82f6'
        },
        {
          type: 'alert',
          title: 'SPRS Score Update Required',
          agency: 'Defense Logistics Agency',
          value: 'Action Needed',
          deadline: '2024-03-30',
          risk: 'High',
          icon: AlertTriangle,
          color: '#ef4444'
        },
        {
          type: 'success',
          title: 'ATO Pathway Approved',
          agency: 'Federal Aviation Administration',
          value: 'Compliance Met',
          deadline: 'Completed',
          risk: 'Low',
          icon: CheckCircle,
          color: '#22c55e'
        }
      ];

      const randomItem = newItemTypes[Math.floor(Math.random() * newItemTypes.length)];
      
      setFeedItems(prev => [
        {
          ...randomItem,
          id: Date.now(),
          timestamp: new Date()
        },
        ...prev.slice(0, 7) // Keep only 8 most recent items
      ]);
    }, 15000); // Add new item every 15 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'var(--risk-high)';
      case 'medium': return 'var(--risk-medium)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="live-feed">
      <div className="feed-header">
        <div className="feed-title">
          <Zap size={16} className={isLive ? 'live-pulse' : ''} />
          <h3>Live Intelligence Feed</h3>
          <div className={`live-indicator ${isLive ? 'live' : 'offline'}`}>
            <span className="live-dot"></span>
            {isLive ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
        <button 
          className="feed-toggle"
          onClick={() => setIsLive(!isLive)}
        >
          {isLive ? 'Pause' : 'Resume'}
        </button>
      </div>

      <div className="feed-content">
        {feedItems.map(item => (
          <div key={item.id} className="feed-item">
            <div className="feed-item-icon" style={{ background: item.color }}>
              <item.icon size={14} />
            </div>
            <div className="feed-item-content">
              <div className="feed-item-header">
                <h4>{item.title}</h4>
                <span className="feed-risk" style={{ color: getRiskColor(item.risk) }}>
                  {item.risk}
                </span>
              </div>
              <div className="feed-item-details">
                <span className="feed-agency">{item.agency}</span>
                <span className="feed-value">{item.value}</span>
                <span className="feed-deadline">{item.deadline}</span>
              </div>
              <div className="feed-item-footer">
                <Clock size={12} />
                <span>{formatTimestamp(item.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="feed-footer">
        <button className="feed-load-more">Load Historical Data</button>
        <div className="feed-stats">
          <span>247 opportunities tracked</span>
          <span>•</span>
          <span>12 high-priority alerts</span>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
