import React from 'react';

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e'
};

const RequirementsLinter = ({ requirements = [], onSelect, selectedId }) => {
  return (
    <div className="studio-linter">
      <div className="linter-header">
        <h3>REQUIREMENTS LINTER</h3>
        <span className="linter-count">{requirements.length} Found</span>
      </div>
      <div className="linter-list">
        {requirements.map((req) => (
          <div 
            key={req.id} 
            className={`linter-item ${selectedId === req.id ? 'active' : ''}`} 
            onClick={() => onSelect?.(req)}
          >
            <div className="linter-item-header">
              <span className="req-id">{req.id}</span>
              <span className="req-severity" style={{ color: SEVERITY_COLORS[req.severity] }}>
                {req.severity.toUpperCase()}
              </span>
            </div>
            <p className="req-text">{req.text}</p>
            <div className="linter-item-footer">
              <span className="req-type">{req.type}</span>
              <div className="req-status-tag unmet">UNMET</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequirementsLinter;
