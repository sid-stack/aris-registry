import React from 'react';

const SolicitationHeader = () => {
  const headerStyles = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '20px',
  };

  const titleStyles = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  };

  const metaStyles = {
    color: 'var(--text-secondary)',
  };

  return (
    <div style={headerStyles} className="dashboard-card">
      <h1 style={titleStyles}>DHA Video Imaging Archive</h1>
      <div style={metaStyles}>
        <p><strong>Agency:</strong> Defense Health Agency</p>
        <p><strong>Solicitation ID:</strong> DHANOISS022426</p>
        <p><strong>Analysis Latency:</strong> 42 seconds</p>
      </div>
    </div>
  );
};

export default SolicitationHeader;
