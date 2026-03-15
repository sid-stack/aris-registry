import React from 'react';
import { CheckCircle, Loader, Brain, PenLine, Scale, Search } from 'lucide-react';

const agents = [
  { icon: Brain,   label: 'Mission Analyst',   desc: 'Synthesizing solicitation data into strategic brief',    delay: 0 },
  { icon: PenLine, label: 'Narrative Synthesizer', desc: 'Writing QDS-style federal proposal draft',              delay: 0.1 },
  { icon: Scale,   label: 'Compliance Auditor',   desc: 'Generating FAR/DFARS-referenced compliance matrix',     delay: 0.2 },
  { icon: Search,  label: 'Win-Theme Architect',  desc: 'Extracting win themes, risk flags & technical outline', delay: 0.3 },
];

const AgenticPipeline = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.05s', background: 'transparent', border: 'none', padding: '0' }}>
    <div className="card-header" style={{ padding: '12px 0' }}>
      <span className="card-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>Agentic Pipeline Status</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {agents.map(({ icon: Icon, label, desc, delay }) => (
        <div key={label} className="animate-in" style={{
          animationDelay: `${delay + 0.1}s`,
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ padding: '8px', background: 'var(--card)', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <Icon size={12} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>COMPLETE</span>
            <CheckCircle size={10} color="var(--success)" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AgenticPipeline;
