import React from 'react';

const indicators = [
  { label: 'Parser Engine',     status: 'ACTIVE',    cls: 'active'  },
  { label: 'Clause Detection',  status: 'RUNNING',   cls: 'active'  },
  { label: 'Compliance Engine', status: 'VERIFIED',  cls: 'active'  },
  { label: 'Security Scanner',  status: 'ONLINE',    cls: 'active'  },
  { label: 'SAM.gov Feed',      status: 'LIVE',      cls: 'active'  },
  { label: 'Risk Classifier',   status: 'READY',     cls: 'active'  },
];

const SystemStatus = () => (
  <div className="dashboard-card grid-col-span-2 animate-in" style={{ animationDelay: '0.05s' }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#5a7a9a', fontWeight: 700, textTransform: 'uppercase' }}>
        SYSTEM STATUS
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {indicators.map(({ label, status, cls }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '5px 12px',
            background: 'rgba(0,208,132,0.06)',
            border: '1px solid rgba(0,208,132,0.15)',
            borderRadius: '3px',
          }}>
            <span className={`status-dot ${cls}`} />
            <span style={{ fontSize: '10px', color: '#d4e4f7', fontFamily: "'Space Mono', monospace" }}>{label}</span>
            <span style={{ fontSize: '9px', color: '#00d084', fontWeight: 700, letterSpacing: '0.08em' }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SystemStatus;
