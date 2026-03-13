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

const MetricsStrip = () => {
  const [contracts, setContracts] = useState(17);
  const [risks, setRisks] = useState(43);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.random();
      if (r < 0.5) setContracts(c => c + 1);
      else setRisks(r2 => r2 + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      icon: <Activity size={16} color="#1e7fff" />,
      label: 'CONTRACTS ANALYZED TODAY',
      value: contracts,
      suffix: '',
      sub: '+3 in last hour',
      color: '#1e7fff',
    },
    {
      icon: <AlertTriangle size={16} color="#ff3b3b" />,
      label: 'COMPLIANCE RISKS DETECTED',
      value: risks,
      suffix: '',
      sub: '12 HIGH severity',
      color: '#ff3b3b',
    },
    {
      icon: <Clock size={16} color="#00d084" />,
      label: 'AVG ANALYSIS TIME',
      value: null,
      display: '91s',
      sub: '↓ 8% vs. yesterday',
      color: '#00d084',
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
