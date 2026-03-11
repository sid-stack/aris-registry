import React from 'react';
import { TableProperties } from 'lucide-react';

const matrix = [
  { id: 'CM-01', requirement: 'SAM.gov Registration',        section: 'Admin',    category: 'Eligibility',   farRef: 'FAR 52.204-7',    status: 'compliant',   risk: 'LOW',    action: 'Confirm active registration before submission.' },
  { id: 'CM-02', requirement: 'NIST SP 800-171 / SPRS Score', section: 'M.3',     category: 'Cybersecurity', farRef: 'DFARS 252.204-7012', status: 'noncompliant', risk: 'HIGH', action: 'Complete NIST self-assessment and post to SPRS immediately.' },
  { id: 'CM-03', requirement: 'Authority to Operate (ATO)',   section: 'M.3',     category: 'Technical',     farRef: 'N/A',             status: 'conditional', risk: 'HIGH',   action: 'Document ATO pathway at IL4 or obtain DAF waiver.' },
  { id: 'CM-04', requirement: 'Small Business Set-Aside',     section: 'H.1',     category: 'Eligibility',   farRef: 'FAR 52.219-6',    status: 'compliant',   risk: 'LOW',    action: 'Certification confirmed. No action required.' },
  { id: 'CM-05', requirement: 'Past Performance (3 refs $5M+)', section: 'L.2.1', category: 'Technical',     farRef: 'FAR Part 15',     status: 'conditional', risk: 'MEDIUM', action: 'Identify third qualifying reference — value >$5M within 5 years.' },
  { id: 'CM-06', requirement: 'PII/PHI Data Handling',        section: 'L.4.2',   category: 'Technical',     farRef: 'N/A',             status: 'conditional', risk: 'HIGH',   action: 'Add dedicated PII/PHI data handling section to Technical Volume.' },
  { id: 'CM-07', requirement: 'NAICS Code Compliance',        section: 'Cover',   category: 'Eligibility',   farRef: 'FAR Part 19',     status: 'compliant',   risk: 'LOW',    action: 'NAICS 518210 confirmed. Size standard $47.0M met.' },
  { id: 'CM-08', requirement: 'PIEE Portal Submission',       section: 'L.6',     category: 'Compliance',    farRef: 'FAR 52.212-1',    status: 'review',      risk: 'MEDIUM', action: 'Register on PIEE. Confirm submission window timing.' },
  { id: 'CM-09', requirement: 'Bid Bond Requirements',        section: 'H.4',     category: 'Financial',     farRef: 'FAR Part 28',     status: 'compliant',   risk: 'LOW',    action: 'Not required per Section H.4.' },
  { id: 'CM-10', requirement: 'Security Clearance',           section: 'M.5',     category: 'Technical',     farRef: 'N/A',             status: 'conditional', risk: 'MEDIUM', action: 'Confirm Secret clearances for all key personnel.' },
  { id: 'CM-11', requirement: 'Subcontracting Plan',          section: 'H.8',     category: 'Compliance',    farRef: 'FAR 52.219-9',    status: 'review',      risk: 'MEDIUM', action: 'Determine if subcontracting plan is required.' },
  { id: 'CM-12', requirement: 'FAR Clause Compliance',        section: 'I',       category: 'Legal',         farRef: 'Various',         status: 'compliant',   risk: 'LOW',    action: 'Standard clauses reviewed. No deviations flagged.' },
];

const statusConfig = {
  compliant:    { label: '✅ Compliant',       color: 'var(--success)',      bg: 'rgba(34,197,94,0.1)' },
  noncompliant: { label: '❌ Non-Compliant',   color: 'var(--risk-high)',    bg: 'rgba(239,68,68,0.1)' },
  conditional:  { label: '⚠️ Conditional',     color: 'var(--risk-medium)',  bg: 'rgba(245,158,11,0.1)' },
  review:       { label: '🔍 Review Required', color: 'var(--accent)',       bg: 'rgba(59,130,246,0.1)' },
};

const riskColor = {
  HIGH:   'var(--risk-high)',
  MEDIUM: 'var(--risk-medium)',
  LOW:    'var(--success)',
};

const ComplianceMatrix = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.1s' }}>
    <div className="card-header">
      <TableProperties size={14} color="var(--accent)" />
      <span className="card-label">Compliance Matrix</span>
      <span style={{
        marginLeft: 'auto', fontSize: '10px', color: 'var(--text-secondary)',
      }}>{matrix.length} Requirements · FAR-Referenced</span>
    </div>

    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['ID', 'Requirement', 'Section', 'Category', 'FAR Reference', 'Bidder Status', 'Risk', 'Action Required'].map(h => (
              <th key={h} style={{
                padding: '8px 10px', textAlign: 'left',
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                color: 'var(--text-secondary)', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map(({ id, requirement, section, category, farRef, status, risk, action }, i) => {
            const s = statusConfig[status];
            return (
              <tr key={id} style={{
                borderBottom: '1px solid rgba(31,41,55,0.6)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
              >
                <td style={{ padding: '10px 10px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'nowrap' }}>{id}</td>
                <td style={{ padding: '10px 10px', color: 'var(--text-primary)', fontWeight: 500, minWidth: '180px' }}>{requirement}</td>
                <td style={{ padding: '10px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '10px' }}>{section}</td>
                <td style={{ padding: '10px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{category}</td>
                <td style={{ padding: '10px 10px', color: 'var(--accent)', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '10px' }}>{farRef}</td>
                <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '3px',
                    background: s.bg, color: s.color,
                  }}>{s.label}</span>
                </td>
                <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: riskColor[risk] }}>{risk}</span>
                </td>
                <td style={{ padding: '10px 10px', color: 'var(--text-secondary)', fontSize: '11px', minWidth: '220px', lineHeight: 1.4 }}>{action}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default ComplianceMatrix;
