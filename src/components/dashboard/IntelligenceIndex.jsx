import React from 'react';
import { TrendingUp, Target, ShieldAlert } from 'lucide-react';

const IntelligenceIndex = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.1s', background: 'transparent', border: 'none', padding: '0' }}>
    <div className="card-header" style={{ padding: '12px 0' }}>
      <span className="card-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>ARIS Intelligence Index™</span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
      {/* Opportunity Score */}
      <div style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--background)' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Opportunity</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>92<span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/100</span></div>
      </div>

      {/* Bid Probability */}
      <div style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--background)' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Bid Prob.</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>85<span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>%</span></div>
      </div>

      {/* Win Probability */}
      <div style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--background)' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Win Rate</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>68<span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>%</span></div>
      </div>
    </div>

    {/* Index breakdown */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 4px' }}>
      {[
        { label: 'Technical Alignment',   score: 93, color: 'var(--text-secondary)' },
        { label: 'Competitive Position',  score: 88, color: 'var(--text-secondary)' },
        { label: 'Compliance Readiness',  score: 72, color: 'var(--risk-high)' },
        { label: 'Past Performance Fit',  score: 86, color: 'var(--text-secondary)' },
      ].map(({ label, score, color }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{score}%</span>
          </div>
          <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${score}%`, background: color === 'var(--risk-high)' ? color : 'var(--text-secondary)',
              borderRadius: '1px', transition: 'width 1s ease',
            }} />
          </div>
        </div>
      ))}
    </div>

    <div style={{
      marginTop: '20px', padding: '12px',
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '4px',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <ShieldAlert size={12} color="var(--risk-high)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--risk-high)' }}>CRITICAL GAP:</strong> ATO documentation missing. Win rate suppression active until confirmed.
      </span>
    </div>
  </div>
);

export default IntelligenceIndex;
