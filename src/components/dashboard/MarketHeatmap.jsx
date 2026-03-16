import React, { useMemo } from 'react';
import { Activity, Zap } from 'lucide-react';

const MarketHeatmap = ({ prospects = [] }) => {
  // Mock data if prospects is empty for demonstration
  const displayData = useMemo(() => {
    if (prospects.length > 0) return prospects;
    return [
      { sector: 'Cybersecurity', intensity: 85, trend: '+12%' },
      { sector: 'Cloud Infrastructure', intensity: 72, trend: '+5%' },
      { sector: 'DOD Aerospace', intensity: 94, trend: '+22%' },
      { sector: 'Federal Health IT', intensity: 45, trend: '-3%' },
      { sector: 'NIST Compliance', intensity: 61, trend: '+8%' },
      { sector: 'Edge Computing', intensity: 33, trend: '+15%' },
      { sector: 'AI/ML Services', intensity: 88, trend: '+31%' },
      { sector: 'Logistics', intensity: 22, trend: '-10%' },
    ];
  }, [prospects]);

  const getColor = (intensity) => {
    if (intensity > 80) return '#00f2ff'; // Hyper Cyan
    if (intensity > 60) return '#7000ff'; // Matrix Purple
    if (intensity > 40) return '#3b82f6'; // Deep Blue
    return '#1e293b'; // Desaturated Slate
  };

  return (
    <div className="market-heatmap-container" style={{
      background: 'rgba(13, 15, 20, 0.4)',
      borderRadius: '12px',
      border: '1px solid rgba(59, 130, 246, 0.1)',
      padding: '20px',
      marginTop: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} className="text-cyan-400" />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', margin: 0, letterSpacing: '0.05em' }}>
            SECTOR_INTENSITY_MATRIX_v2.2
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#00f2ff' }} /> High Alpha
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#7000ff' }} /> Emerging
          </div>
        </div>
      </div>

      <div className="heatmap-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {displayData.map((item, idx) => (
          <div 
            key={idx}
            className="heatmap-cell"
            style={{
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.3)',
              borderRadius: '8px',
              border: `1px solid ${getColor(item.intensity)}33`,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Intensity Bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              width: `${item.intensity}%`,
              background: getColor(item.intensity),
              boxShadow: `0 0 10px ${getColor(item.intensity)}66`
            }} />

            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.sector.toUpperCase()}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>
                {item.intensity}<span style={{ fontSize: '12px', opacity: 0.5 }}>%</span>
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: item.trend.startsWith('+') ? '#4ade80' : '#f87171',
                padding: '2px 6px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {item.trend.startsWith('+') ? <Zap size={10} /> : null}
                {item.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .heatmap-cell:hover {
          background: rgba(30, 41, 59, 0.6) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .heatmap-cell::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default MarketHeatmap;
