import React from 'react';
import { TrendingUp, Target, ShieldAlert } from 'lucide-react';

const IntelligenceIndex = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.1s', background: 'transparent', border: 'none', padding: '0' }}>
    <div className="card-header" style={{ padding: '12px 0' }}>
      <span className="card-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}>ARIS Intelligence Index™</span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#1a1a1a', border: '1px solid #1a1a1a', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
      {/* Opportunity Score */}
      <div style={{ textAlign: 'center', padding: '16px 8px', background: '#09090b' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#52525b', marginBottom: '8px', textTransform: 'uppercase' }}>Opportunity</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#e4e4e7', lineHeight: 1 }}>78<span style={{ fontSize: '12px', color: '#52525b' }}>/100</span></div>
      </div>

      {/* Bid Probability */}
      <div style={{ textAlign: 'center', padding: '16px 8px', background: '#09090b' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#52525b', marginBottom: '8px', textTransform: 'uppercase' }}>Bid Prob.</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#e4e4e7', lineHeight: 1 }}>63<span style={{ fontSize: '16px', color: '#52525b' }}>%</span></div>
      </div>

      {/* Win Probability */}
      <div style={{ textAlign: 'center', padding: '16px 8px', background: '#09090b' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#52525b', marginBottom: '8px', textTransform: 'uppercase' }}>Win Rate</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#e4e4e7', lineHeight: 1 }}>31<span style={{ fontSize: '16px', color: '#52525b' }}>%</span></div>
      </div>
    </div>

    {/* Index breakdown */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 4px' }}>
      {[
        { label: 'Technical Alignment',   score: 82, color: '#a1a1aa' },
        { label: 'Competitive Position',  score: 67, color: '#a1a1aa' },
        { label: 'Compliance Readiness',  score: 48, color: '#ef4444' },
        { label: 'Past Performance Fit',  score: 74, color: '#a1a1aa' },
      ].map(({ label, score, color }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#e4e4e7', fontFamily: 'monospace' }}>{score}%</span>
          </div>
          <div style={{ height: '2px', background: '#1a1a1a', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${score}%`, background: color === '#ef4444' ? color : '#3f3f46',
              borderRadius: '1px', transition: 'width 1s ease',
            }} />
          </div>
        </div>
      ))}
    </div>

    <div style={{
      marginTop: '20px', padding: '12px',
      background: '#0c0c0e', border: '1px solid #1a1a1a', borderRadius: '4px',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <ShieldAlert size={12} color="#ef4444" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '10px', color: '#a1a1aa', lineHeight: 1.5 }}>
        <strong style={{ color: '#ef4444' }}>CRITICAL GAP:</strong> ATO documentation missing. Win rate suppression active until confirmed.
      </span>
    </div>
  </div>
);

export default IntelligenceIndex;
