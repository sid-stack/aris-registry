import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Building, DollarSign, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const FederalOpportunities = () => {
  const [opportunities, setOpportunities] = useState([
    {
      id: 1,
      agency: 'Department of Veterans Affairs',
      title: 'VA Cloud Modernization Phase II',
      value: 45200000,
      deadline: '2024-04-15',
      location: 'Washington, DC',
      status: 'Open',
      confidence: 78,
      riskLevel: 'Medium',
      requirements: ['Cloud', 'Security', 'Compliance'],
      posted: new Date('2024-03-01')
    },
    {
      id: 2,
      agency: 'General Services Administration',
      title: 'GSA Data Analytics Platform',
      value: 28700000,
      deadline: '2024-04-22',
      location: 'Remote',
      status: 'Open',
      confidence: 85,
      riskLevel: 'Low',
      requirements: ['Analytics', 'AI/ML', 'Data Visualization'],
      posted: new Date('2024-03-05')
    },
    {
      id: 3,
      agency: 'Department of Homeland Security',
      title: 'DHS Cybersecurity Assessment Framework',
      value: 67300000,
      deadline: '2024-05-01',
      location: 'Arlington, VA',
      status: 'Coming Soon',
      confidence: 72,
      riskLevel: 'High',
      requirements: ['Cybersecurity', 'RMF', 'ATO'],
      posted: new Date('2024-03-10')
    },
    {
      id: 4,
      agency: 'National Aeronautics and Space Administration',
      title: 'NASA Imaging Pipeline Modernization',
      value: 38900000,
      deadline: '2024-04-30',
      location: 'Houston, TX',
      status: 'Open',
      confidence: 81,
      riskLevel: 'Medium',
      requirements: ['Imaging', 'Pipeline', 'Storage'],
      posted: new Date('2024-03-08')
    },
    {
      id: 5,
      agency: 'Department of Defense',
      title: 'Air Force AI Logistics System',
      value: 52100000,
      deadline: '2024-05-15',
      location: 'Wright-Patterson AFB, OH',
      status: 'Open',
      confidence: 69,
      riskLevel: 'High',
      requirements: ['AI/ML', 'Logistics', 'Defense Systems'],
      posted: new Date('2024-03-12')
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'var(--success)';
    if (confidence >= 70) return 'var(--risk-medium)';
    return 'var(--risk-high)';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'var(--success)';
      case 'Medium': return 'var(--risk-medium)';
      case 'High': return 'var(--risk-high)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <CheckCircle size={14} color="var(--success)" />;
      case 'Coming Soon': return <Clock size={14} color="var(--risk-medium)" />;
      case 'Closed': return <AlertCircle size={14} color="var(--risk-high)" />;
      default: return null;
    }
  };

  const filteredOpportunities = opportunities
    .filter(opp => filter === 'all' || opp.riskLevel === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'value': return b.value - a.value;
        case 'confidence': return b.confidence - a.confidence;
        case 'deadline': return new Date(a.deadline) - new Date(b.deadline);
        default: return 0;
      }
    });

  const totalValue = filteredOpportunities.reduce((sum, opp) => sum + opp.value, 0);
  const avgConfidence = filteredOpportunities.length > 0 
    ? Math.round(filteredOpportunities.reduce((sum, opp) => sum + opp.confidence, 0) / filteredOpportunities.length)
    : 0;

  return (
    <div className="federal-opportunities">
      <div className="opportunities-header">
        <div className="opportunities-title">
          <Building size={18} color="var(--accent)" />
          <h3 style={{ color: 'var(--text-primary)' }}>Federal Opportunities Radar</h3>
          <div className="live-badge" style={{ background: 'var(--card)', color: 'var(--accent)', border: '1px solid var(--border)' }}>LIVE SAM.gov FEED</div>
        </div>
        <div className="opportunities-stats">
          <div className="stat-item" style={{ color: 'var(--text-primary)' }}>
            <DollarSign size={14} color="var(--success)" />
            <span>{formatValue(totalValue)}</span>
          </div>
          <div className="stat-item" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp size={14} color="var(--accent)" />
            <span>{avgConfidence}% Match</span>
          </div>
        </div>
      </div>

      <div className="opportunities-filters">
        <div className="filter-group">
          <label>Risk Level:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="deadline">Deadline</option>
            <option value="value">Value</option>
            <option value="confidence">Match Score</option>
          </select>
        </div>
      </div>

      <div className="opportunities-list">
        {filteredOpportunities.map(opp => (
          <div key={opp.id} className="opportunity-card">
            <div className="opportunity-header">
              <div className="opportunity-agency">{opp.agency}</div>
              <div className="opportunity-status">
                {getStatusIcon(opp.status)}
                <span>{opp.status}</span>
              </div>
            </div>
            
            <h4 className="opportunity-title">{opp.title}</h4>
            
            <div className="opportunity-details">
              <div className="detail-item">
                <DollarSign size={14} />
                <span>{formatValue(opp.value)}</span>
              </div>
              <div className="detail-item">
                <Calendar size={14} />
                <span>{opp.deadline}</span>
              </div>
              <div className="detail-item">
                <MapPin size={14} />
                <span>{opp.location}</span>
              </div>
            </div>

            <div className="opportunity-metrics">
              <div className="metric">
                <span className="metric-label">Match Score</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill"
                    style={{ 
                      width: `${opp.confidence}%`,
                      background: getConfidenceColor(opp.confidence)
                    }}
                  ></div>
                </div>
                <span className="metric-value" style={{ color: getConfidenceColor(opp.confidence) }}>
                  {opp.confidence}%
                </span>
              </div>
              
              <div className="risk-indicator">
                <span className="risk-label">Risk</span>
                <span 
                  className="risk-value"
                  style={{ color: getRiskColor(opp.riskLevel) }}
                >
                  {opp.riskLevel}
                </span>
              </div>
            </div>

            <div className="opportunity-requirements">
              {opp.requirements.map((req, index) => (
                <span key={index} className="requirement-tag">{req}</span>
              ))}
            </div>

            <div className="opportunity-actions">
              <button className="analyze-btn">Analyze Opportunity</button>
              <button className="track-btn">Track</button>
            </div>
          </div>
        ))}
      </div>

      <div className="opportunities-footer">
        <button className="load-more">Load More Opportunities</button>
        <div className="data-source">
          <span>Data source: SAM.gov API</span>
          <span>Last updated: 2 minutes ago</span>
        </div>
      </div>
    </div>
  );
};

export default FederalOpportunities;
