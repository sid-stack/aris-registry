import React from 'react';

const SolicitationHeader = ({ 
  title = "DHA Video Imaging Archive", 
  agency = "Defense Health Agency", 
  id = "DHANOISS022426", 
  analysisTime = "83 seconds" 
}) => {
  const headerStyles = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '20px',
  };

  const titleStyles = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    marginBottom: '16px',
    letterSpacing: '-0.02em'
  };

  const metaStyles = {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  return (
    <div style={headerStyles} className="dashboard-card">
      <h1 style={titleStyles}>{title}</h1>
      <div style={metaStyles}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ color: '#71717a', fontWeight: 600 }}>AGENCY:</span> 
          <span>{agency}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ color: '#71717a', fontWeight: 600 }}>ID:</span> 
          <span style={{ fontFamily: 'monospace' }}>{id}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ color: '#71717a', fontWeight: 600 }}>ANALYSIS:</span> 
          <span>{analysisTime}</span>
        </div>
      </div>
    </div>
  );
};

export default SolicitationHeader;
