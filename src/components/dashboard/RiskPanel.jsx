import React from 'react';
import { AlertTriangle } from 'lucide-react';

const RiskPanel = () => (
  <div className="dashboard-card glow-risk animate-in" style={{ animationDelay: '0.1s' }}>
    <div className="card-header">
      <AlertTriangle size={14} color="#ff3b3b" />
      <span className="card-label" style={{ color: '#ff3b3b' }}>RISK ASSESSMENT</span>
    </div>

    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#5a7a9a', marginBottom: '8px' }}>OVERALL RISK SCORE</div>
      <div style={{
        fontSize: '72px',
        fontWeight: 700,
        color: '#ff3b3b',
        lineHeight: 1,
        fontFamily: "'Space Mono', monospace",
        textShadow: '0 0 40px rgba(255,59,59,0.4)',
      }}>87</div>
      <div style={{ fontSize: '11px', color: '#5a7a9a', marginTop: '4px' }}>/100</div>

      <div style={{ marginTop: '16px' }}>
        <span className="risk-badge high" style={{ fontSize: '12px', padding: '6px 16px' }}>
          <span className="status-dot danger" /> HIGH RISK
        </span>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '10px',
        background: 'rgba(255,59,59,0.06)',
        border: '1px solid rgba(255,59,59,0.15)',
        borderRadius: '3px',
        fontSize: '11px',
        color: '#9aa8b8',
        lineHeight: 1.6,
      }}>
        Confidence: <span style={{ color: '#ff3b3b', fontWeight: 700 }}>92%</span> &nbsp;·&nbsp;
        Clauses Flagged: <span style={{ color: '#ff3b3b', fontWeight: 700 }}>14</span>
      </div>
    </div>
  </div>
);

export default RiskPanel;
