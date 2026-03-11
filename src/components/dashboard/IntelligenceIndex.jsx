import React from 'react';
import { TrendingUp, Target, ShieldAlert } from 'lucide-react';

const IntelligenceIndex = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.1s' }}>
    <div className="card-header">
      <TrendingUp size={14} color="var(--accent)" />
      <span className="card-label">BidSmith Intelligence Index™</span>
      <span style={{
        marginLeft: 'auto', fontSize: '9px', fontWeight: 700,
        background: 'rgba(59,130,246,0.12)', color: 'var(--accent)',
        border: '1px solid rgba(59,130,246,0.25)',
        padding: '2px 8px', borderRadius: '3px', letterSpacing: '0.08em',
      }}>BETA SCORE</span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
      {/* Opportunity Score */}
      <div style={{
        textAlign: 'center', padding: '16px 8px',
        background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '6px',
      }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Opportunity Score</div>
        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>78</div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>/100</div>
      </div>

      {/* Bid Probability */}
      <div style={{
        textAlign: 'center', padding: '16px 8px',
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '6px',
      }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Bid Probability</div>
        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--risk-medium)', lineHeight: 1 }}>63<span style={{ fontSize: '18px' }}>%</span></div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>conditional</div>
      </div>

      {/* Win Probability */}
      <div style={{
        textAlign: 'center', padding: '16px 8px',
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px',
      }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Est. Win Rate</div>
        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--risk-high)', lineHeight: 1 }}>31<span style={{ fontSize: '18px' }}>%</span></div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>w/o ATO</div>
      </div>
    </div>

    {/* Index breakdown */}
    {[
      { label: 'Technical Alignment',   score: 82, color: 'var(--success)' },
      { label: 'Competitive Position',  score: 67, color: 'var(--risk-medium)' },
      { label: 'Compliance Readiness',  score: 48, color: 'var(--risk-high)' },
      { label: 'Past Performance Fit',  score: 74, color: 'var(--accent)' },
    ].map(({ label, score, color }) => (
      <div key={label} style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color }}>{score}</span>
        </div>
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${score}%`, background: color,
            borderRadius: '2px', transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
      </div>
    ))}

    <div style={{
      marginTop: '14px', padding: '10px 12px',
      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <ShieldAlert size={14} color="var(--risk-high)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--risk-high)' }}>Compliance Risk: HIGH</strong> — ATO documentation gap detected. Score will increase to 91 upon ATO pathway confirmation.
      </span>
    </div>
  </div>
);

export default IntelligenceIndex;
