import React from 'react';
import { Search, Brain, FileText, Shield, TrendingUp, CheckCircle } from 'lucide-react';

const agents = [
  { icon: Brain,   label: 'Mission Analyst',   desc: 'Synthesizing solicitation data into strategic brief',    delay: 0 },
  { icon: Shield,   label: 'BidSmith Intelligence', desc: 'Applying discovered logic patterns & federal intelligence', delay: 0.1 },
  { icon: FileText, label: 'Narrative Synthesizer', desc: 'Writing QDS-style federal proposal draft',              delay: 0.2 },
  { icon: CheckCircle, label: 'Compliance Auditor',   desc: 'Generating FAR/DFARS-referenced compliance matrix',     delay: 0.3 },
  { icon: TrendingUp,  label: 'Win-Theme Architect',  desc: 'Extracting win themes, risk flags & technical outline', delay: 0.4 },
];

const AgenticPipeline = ({ initializing = false }) => (
  <div className="dashboard-card animate-in" style={{ 
    animationDelay: '0.05s', 
    background: 'rgba(255, 255, 255, 0.03)', 
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.05)', 
    padding: '16px',
    borderRadius: '12px',
    position: 'relative'
  }}>
    {initializing && (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(5, 7, 11, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 10,
        borderRadius: '12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '12px'
      }}>
        <div className="pattern-badge" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
          Initializing BidSmith Registry...
        </div>
        <div style={{ width: '100px', height: '1px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
          <div className="pattern-badge" style={{ width: '40px', height: '100%', background: 'var(--text-primary)' }}></div>
        </div>
      </div>
    )}
    <style>{`
      @keyframes pattern-pulse {
        0% { opacity: 0.6; transform: scale(0.98); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0.6; transform: scale(0.98); }
      }
      .pattern-badge {
        animation: pattern-pulse 2s infinite ease-in-out;
      }
    `}</style>
    <div className="card-header" style={{ padding: '0 0 16px 0' }}>
      <span className="card-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)', fontWeight: 700 }}>Agentic Pipeline Status</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {agents.map(({ icon: Icon, label, desc, delay }) => (
        <div key={label} className="animate-in" style={{
          animationDelay: `${delay + 0.1}s`,
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '14px 0',
          borderBottom: label === agents[agents.length - 1].label ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Icon size={14} color="var(--text-secondary)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{label}</div>
              {label === 'BidSmith Intelligence' && (
                <div className="pattern-badge" style={{ 
                  fontSize: '9px', 
                  background: 'rgba(59, 130, 246, 0.15)', 
                  color: 'rgb(96, 165, 250)', 
                  padding: '1px 8px', 
                  borderRadius: '100px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontWeight: 800,
                  letterSpacing: '0.05em'
                }}>
                  #PAT-822
                </div>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.4' }}>
              {label === 'BidSmith Intelligence' ? 'Applying Pattern: Financial Compliance Conflict' : desc}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>COMPLETE</span>
            <CheckCircle size={12} color="var(--success)" strokeWidth={1.5} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AgenticPipeline;
