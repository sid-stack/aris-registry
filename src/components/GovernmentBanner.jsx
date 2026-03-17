import React from 'react';

const GovernmentBanner = () => {
  const agencies = [
    { name: 'SAM.gov', description: 'System for Award Management', type: 'primary' },
    { name: 'Grants.gov', description: 'Federal Grant Opportunities', type: 'primary' },
    { name: 'FBO.gov', description: 'FedBizOpps (Archived)', type: 'legacy' },
    { name: 'Defense.gov', description: 'Department of Defense', type: 'agency' },
    { name: 'NASA.gov', description: 'NASA Opportunities', type: 'agency' },
    { name: 'HHS.gov', description: 'Health & Human Services', type: 'agency' },
    { name: 'DOE.gov', description: 'Department of Energy', type: 'agency' },
    { name: 'EPA.gov', description: 'Environmental Protection Agency', type: 'agency' },
    { name: 'GSA.gov', description: 'General Services Administration', type: 'agency' },
    { name: 'USAF.gov', description: 'U.S. Air Force', type: 'military' },
    { name: 'ARMY.mil', description: 'U.S. Army', type: 'military' },
    { name: 'NAVY.mil', description: 'U.S. Navy', type: 'military' },
    { name: 'DARPA.mil', description: 'Defense Advanced Research Projects', type: 'military' },
    { name: 'NSF.gov', description: 'National Science Foundation', type: 'agency' },
    { name: 'NIH.gov', description: 'National Institutes of Health', type: 'agency' },
    { name: 'USAJOBS.gov', description: 'Federal Employment', type: 'agency' },
    { name: 'Regulations.gov', description: 'Federal Rulemaking', type: 'agency' },
    { name: 'USASpending.gov', description: 'Federal Spending Data', type: 'data' },
    { name: 'Data.gov', description: 'Open Government Data', type: 'data' },
    { name: 'USA.gov', description: 'Official Government Portal', type: 'portal' }
  ];

  return (
    <div className="government-banner-container">
      <div className="government-banner-track">
        {agencies.map((agency, index) => (
          <div key={index} className={`agency-item ${agency.type}`}>
            <div className="agency-icon">
              {agency.type === 'primary' && '🏛️'}
              {agency.type === 'agency' && '🏢'}
              {agency.type === 'military' && '⚔️'}
              {agency.type === 'data' && '📊'}
              {agency.type === 'portal' && '🌐'}
              {agency.type === 'legacy' && '📋'}
            </div>
            <div className="agency-info">
              <span className="agency-name">{agency.name}</span>
              <span className="agency-desc">{agency.description}</span>
            </div>
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {agencies.map((agency, index) => (
          <div key={`duplicate-${index}`} className={`agency-item ${agency.type}`}>
            <div className="agency-icon">
              {agency.type === 'primary' && '🏛️'}
              {agency.type === 'agency' && '🏢'}
              {agency.type === 'military' && '⚔️'}
              {agency.type === 'data' && '📊'}
              {agency.type === 'portal' && '🌐'}
              {agency.type === 'legacy' && '📋'}
            </div>
            <div className="agency-info">
              <span className="agency-name">{agency.name}</span>
              <span className="agency-desc">{agency.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GovernmentBanner;
