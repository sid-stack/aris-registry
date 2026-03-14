import React, { useState } from 'react';

const SecurityToggle = () => {
  const [isStateless, setIsStateless] = useState(true);

  return (
    <div className="security-toggle-container" onClick={() => setIsStateless(!isStateless)}>
      <div className={`status-orb ${isStateless ? 'active' : 'inactive'}`} />
      <div className="toggle-labels">
        <span className="primary-label">STATELESS MODE: {isStateless ? 'ON' : 'OFF'}</span>
        <span className="secondary-label">
          {isStateless ? 'Memory Only • Data Wipe on Close' : 'Local Persistence Enabled'}
        </span>
      </div>
      <style>{`
        .security-toggle-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(39, 39, 42, 0.5);
          border: 1px solid #27272a;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
        }
        .security-toggle-container:hover {
          background: rgba(39, 39, 42, 0.8);
          border-color: #3b82f6;
        }
        .status-orb {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
        }
        .status-orb.active {
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
          animation: securityPulse 2s infinite;
        }
        .status-orb.inactive {
          background: #71717a;
        }
        .toggle-labels {
          display: flex;
          flex-direction: column;
        }
        .primary-label {
          font-size: 10px;
          font-weight: 800;
          color: #e4e4e7;
          letter-spacing: 0.05em;
        }
        .secondary-label {
          font-size: 9px;
          color: #71717a;
        }
        @keyframes securityPulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </div>
  );
};

export default SecurityToggle;
