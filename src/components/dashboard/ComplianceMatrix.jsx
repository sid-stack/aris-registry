import React, { useState, useEffect } from 'react';
import { TableProperties } from 'lucide-react';
import '../../pages/SamRep.css';

const matrix = [
  { id: 'CM-01', requirement: 'SAM.gov Registration',          section: 'Admin',  category: 'Eligibility',   farRef: 'FAR 52.204-7',      status: 'compliant',    risk: 'LOW',    action: 'Confirm active registration before submission.' },
  { id: 'CM-02', requirement: 'NIST SP 800-171 / SPRS Score',  section: 'M.3',    category: 'Cybersecurity', farRef: 'DFARS 252.204-7012', status: 'noncompliant', risk: 'HIGH',   action: 'Complete NIST self-assessment and post to SPRS immediately.' },
  { id: 'CM-03', requirement: 'Authority to Operate (ATO)',     section: 'M.3',    category: 'Technical',     farRef: 'N/A',               status: 'conditional',  risk: 'HIGH',   action: 'Document ATO pathway at IL4 or obtain DAF waiver.' },
  { id: 'CM-04', requirement: 'Small Business Set-Aside',       section: 'H.1',    category: 'Eligibility',   farRef: 'FAR 52.219-6',      status: 'compliant',    risk: 'LOW',    action: 'Certification confirmed. No action required.' },
  { id: 'CM-05', requirement: 'Past Performance (3 refs $5M+)', section: 'L.2.1',  category: 'Technical',     farRef: 'FAR Part 15',       status: 'conditional',  risk: 'MEDIUM', action: 'Identify third qualifying reference — value >$5M within 5 years.' },
  { id: 'CM-06', requirement: 'PII/PHI Data Handling',          section: 'L.4.2',  category: 'Technical',     farRef: 'N/A',               status: 'conditional',  risk: 'HIGH',   action: 'Add dedicated PII/PHI data handling section to Technical Volume.' },
  { id: 'CM-07', requirement: 'NAICS Code Compliance',          section: 'Cover',  category: 'Eligibility',   farRef: 'FAR Part 19',       status: 'compliant',    risk: 'LOW',    action: 'NAICS 518210 confirmed. Size standard $47.0M met.' },
  { id: 'CM-08', requirement: 'PIEE Portal Submission',         section: 'L.6',    category: 'Compliance',    farRef: 'FAR 52.212-1',      status: 'review',       risk: 'MEDIUM', action: 'Register on PIEE. Confirm submission window timing.' },
  { id: 'CM-09', requirement: 'Bid Bond Requirements',          section: 'H.4',    category: 'Financial',     farRef: 'FAR Part 28',       status: 'compliant',    risk: 'LOW',    action: 'Not required per Section H.4.' },
  { id: 'CM-10', requirement: 'Security Clearance',             section: 'M.5',    category: 'Technical',     farRef: 'N/A',               status: 'conditional',  risk: 'MEDIUM', action: 'Confirm Secret clearances for all key personnel.' },
  { id: 'CM-11', requirement: 'Subcontracting Plan',            section: 'H.8',    category: 'Compliance',    farRef: 'FAR 52.219-9',      status: 'review',       risk: 'MEDIUM', action: 'Determine if subcontracting plan is required.' },
  { id: 'CM-12', requirement: 'FAR Clause Compliance',          section: 'I',      category: 'Legal',         farRef: 'Various',           status: 'compliant',    risk: 'LOW',    action: 'Standard clauses reviewed. No deviations flagged.' },
];

const statusConfig = {
  compliant:    { label: '✅ Compliant',       color: 'var(--success)',     bg: 'rgba(34,197,94,0.1)' },
  noncompliant: { label: '❌ Non-Compliant',   color: 'var(--risk-high)',   bg: 'rgba(239,68,68,0.1)' },
  conditional:  { label: '⚠️ Conditional',     color: 'var(--risk-medium)', bg: 'rgba(245,158,11,0.1)' },
  review:       { label: '🔍 Review Required', color: 'var(--accent)',      bg: 'rgba(59,130,246,0.1)' },
};

const riskColor = { HIGH: 'var(--risk-high)', MEDIUM: 'var(--risk-medium)', LOW: 'var(--success)' };

const MobileComplianceCard = ({ req }) => {
  const [expanded, setExpanded] = useState(false);
  const s = statusConfig[req.status];

  return (
    <div style={{
      background: "#09090b",
      border: "1px solid #27272a",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "monospace", fontSize: "14px", color: "#a1a1aa", fontWeight: 600 }}>
            {req.id}
          </span>
        </div>
        
        <div style={{ 
          fontSize: "10px", 
          fontWeight: 700, 
          color: s.color,
          border: `1px solid ${s.color}`,
          background: s.bg,
          padding: "4px 8px",
          borderRadius: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {s.label}
        </div>
      </div>

      <div style={{ 
        fontSize: "15px", 
        color: "#e4e4e7", 
        lineHeight: "1.6",
        wordBreak: "break-word",
        display: expanded ? "block" : "-webkit-box",
        WebkitLineClamp: expanded ? "unset" : 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }}>
        {req.requirement}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "12px", color: "#a1a1aa" }}>
        <span><strong>Sec:</strong> {req.section}</span>
        <span>•</span>
        <span><strong>Cat:</strong> {req.category}</span>
        <span>•</span>
        <span><strong>FAR:</strong> {req.farRef}</span>
        <span>•</span>
        <span style={{ color: riskColor[req.risk] }}><strong>Risk:</strong> {req.risk}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #27272a", fontSize: "13px", color: "#d4d4d8" }}>
          <strong>Action: </strong>{req.action}
        </div>
      )}

      <button 
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "transparent",
          border: "none",
          borderTop: "1px solid #27272a",
          color: "#4a7cff",
          fontSize: "13px",
          fontWeight: "600",
          padding: "16px 0 4px 0",
          marginTop: "4px",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "1px",
          cursor: "pointer",
          minHeight: "44px",
          width: "100%"
        }}
      >
        {expanded ? "Hide Details ↑" : "View Full Requirement ↓"}
      </button>
    </div>
  );
};

const ComplianceMatrix = ({ complianceData, isLoading }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dataToRender = complianceData && complianceData.length > 0 ? complianceData : matrix;

  return (
    <div className="dashboard-card animate-in" style={{ animationDelay: '0.1s' }}>
    <div className="card-header">
      <TableProperties size={14} color="var(--accent)" />
      <span className="card-label">Compliance Matrix</span>
      <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-secondary)' }}>
        {dataToRender.length} Requirements
      </span>
    </div>

    {isLoading ? (
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', padding: '16px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <div style={{ height: '16px', width: '16px', background: 'rgba(59,130,246,0.3)', borderRadius: '50%' }}></div>
            <div style={{ height: '16px', width: '75%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
            <div style={{ height: '16px', width: '20%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginLeft: 'auto' }}></div>
          </div>
        ))}
        <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent)', fontFamily: 'monospace', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
          [ARIS_BRIDGE]: INGESTING_BITSTREAM... MAPPING_TO_NIST_800-171...
        </p>
      </div>
    ) : isMobile ? (
      <div className="compliance-mobile-stack" style={{ marginTop: '16px' }}>
        {dataToRender.map((req, i) => {
          const reqMapped = {
              id: req.id,
              requirement: req.text || req.requirement,
              section: req.section || 'N/A',
              category: req.type || req.category,
              farRef: req.farRef || 'N/A',
              status: req.status || 'review',
              risk: (req.severity || req.risk || 'MEDIUM').toUpperCase(),
              action: req.action || 'Extracted via ARIS.'
          };
          return <MobileComplianceCard key={reqMapped.id || i} req={reqMapped} />
        })}
      </div>
    ) : (
      <div className="compliance-table-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Requirement', 'Section', 'Category', 'FAR Reference', 'Status', 'Risk', 'Action'].map(h => (
                <th key={h} style={{
                  padding: '8px 10px', textAlign: 'left',
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                  color: 'var(--text-secondary)', textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataToRender.map((rawReq, i) => {
              const reqObj = {
                  id: rawReq.id,
                  requirement: rawReq.text || rawReq.requirement,
                  section: rawReq.section || 'N/A',
                  category: rawReq.type || rawReq.category,
                  farRef: rawReq.farRef || 'N/A',
                  status: rawReq.status || 'review',
                  risk: (rawReq.severity || rawReq.risk || 'MEDIUM').toUpperCase(),
                  action: rawReq.action || 'Extracted via ARIS Engine Phase 1. Complete review required.'
              };
              const { id, requirement, section, category, farRef, status, risk, action } = reqObj;
              const s = statusConfig[status] || statusConfig.review;
              const rc = riskColor[risk] || riskColor.MEDIUM;
              return (
                <tr key={id || i} style={{
                  borderBottom: '1px solid rgba(31,41,55,0.6)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ padding: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'nowrap' }}>{id}</td>
                  <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 500, minWidth: '160px' }}>{requirement}</td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '10px' }}>{section}</td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{category}</td>
                  <td style={{ padding: '10px', color: 'var(--accent)', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '10px' }}>{farRef}</td>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '3px', background: s.bg, color: s.color }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: rc }}>{risk}</span>
                  </td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)', fontSize: '11px', minWidth: '200px', lineHeight: 1.4 }}>{action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
  );
};

export default ComplianceMatrix;
