import React from 'react';
import { CheckCircle, Loader, Brain, PenLine, Scale, Search } from 'lucide-react';

const agents = [
  { icon: Brain,   label: 'Analyst Agent',   desc: 'Synthesizing solicitation data into strategic brief',    delay: 0 },
  { icon: PenLine, label: 'Drafter Agent',    desc: 'Writing QDS-style federal proposal draft',              delay: 0.1 },
  { icon: Scale,   label: 'Reviewer Agent',   desc: 'Generating FAR-referenced compliance matrix',           delay: 0.2 },
  { icon: Search,  label: 'Intel Agent',      desc: 'Extracting win themes, risk flags & volume outline',    delay: 0.3 },
];

const AgenticPipeline = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.05s' }}>
    <div className="card-header">
      <span className="card-label">⚙ Agentic Pipeline</span>
      <span style={{
        marginLeft: 'auto', fontSize: '10px', fontWeight: 700,
        color: 'var(--success)', letterSpacing: '0.08em',
      }}>ALL SYSTEMS COMPLETE</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {agents.map(({ icon: Icon, label, desc, delay }) => (
        <div key={label} className="animate-in" style={{
          animationDelay: `${delay + 0.1}s`,
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 14px',
          background: 'rgba(34,197,94,0.04)',
          border: '1px solid rgba(34,197,94,0.12)',
          borderRadius: '6px',
        }}>
          <Icon size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle size={13} color="var(--success)" />
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--success)', letterSpacing: '0.08em' }}>DONE</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AgenticPipeline;
