import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock } from 'lucide-react';

const Counter = ({ target, duration = 2000, suffix = '' }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{value}{suffix}</>;
};

const MetricsStrip = ({ 
  analyzedCount = 142, 
  riskCount = 14, 
  criticalCount = 2,
  analysisTime = "42s"
}) => {
  const metrics = [
    {
      icon: <Activity size={16} color="var(--text-secondary)" />,
      label: 'CONTRACT CONSTRAINTS MAPPED',
      value: analyzedCount,
      suffix: '',
      sub: `${analyzedCount} identifiers logged`,
      color: 'var(--text-primary)',
    },
    {
      icon: <AlertTriangle size={16} color="var(--risk-high)" />,
      label: 'CRITICAL COMPLIANCE DRIFTS',
      value: riskCount,
      suffix: '',
      sub: `${criticalCount} SECURITY severity`,
      color: 'var(--risk-high)',
    },
    {
      icon: <Clock size={16} color="var(--text-secondary)" />,
      label: 'STATELESS CYCLE LATENCY',
      value: null,
      display: analysisTime,
      sub: 'Agentic Purge Verified',
      color: 'var(--text-secondary)',
    },
  ];

  return (
    <div className="dashboard-card animate-in" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}>
        {metrics.map((m, i) => (
          <div key={m.label} style={{
            padding: '16px 20px',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }} className="metric-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {m.icon}
              <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-secondary)', fontWeight: 800 }}>
                {m.label}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: m.color, lineHeight: 1, fontFamily: "'Space Mono', monospace" }}>
              {m.value !== null ? <Counter target={m.value} /> : m.display}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: "'Space Mono', monospace", opacity: 0.8 }}>{m.sub}</div>
          </div>
        ))}
      </div>
      <style>{`
        .metric-item:last-child {
          border-right: none;
          border-bottom: none;
        }
        @media (max-width: 600px) {
          .metric-item {
            border-right: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MetricsStrip;
