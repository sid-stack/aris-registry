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
      icon: <Activity size={16} color="#71717a" />,
      label: 'CONTRACT CONSTRAINTS MAPPED',
      value: analyzedCount,
      suffix: '',
      sub: `${analyzedCount} identifiers logged`,
      color: '#e4e4e7',
    },
    {
      icon: <AlertTriangle size={16} color="#ef4444" />,
      label: 'CRITICAL COMPLIANCE DRIFTS',
      value: riskCount,
      suffix: '',
      sub: `${criticalCount} SECURITY severity`,
      color: '#ef4444',
    },
    {
      icon: <Clock size={16} color="#71717a" />,
      label: 'STATELESS CYCLE LATENCY',
      value: null,
      display: analysisTime,
      sub: 'Agentic Purge Verified',
      color: '#a1a1aa',
    },
  ];

  return (
    <div className="dashboard-card grid-col-span-2 animate-in" style={{ padding: '0' }}>
      <div className="metrics-strip-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      }}>
        {metrics.map((m, i) => (
          <div key={m.label} style={{
            padding: '18px 24px',
            borderRight: i < 2 ? '1px solid #1a2840' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {m.icon}
              <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#5a7a9a', fontWeight: 700 }}>
                {m.label}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: m.color, lineHeight: 1, fontFamily: "'Space Mono', monospace" }}>
              {m.value !== null ? <Counter target={m.value} /> : m.display}
            </div>
            <div style={{ fontSize: '10px', color: '#3a5a7a', fontFamily: "'Space Mono', monospace" }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsStrip;
