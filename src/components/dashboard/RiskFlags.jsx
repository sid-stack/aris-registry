import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const flags = [
  {
    id: 'RF-001',
    severity: 'HIGH',
    title: 'Authority to Operate (ATO) — DoD/DAF Network Required',
    detail: 'Section M.3 explicitly mandates ATO documentation at IL4 or above. Missing SPRS entry will result in technical disqualification without further evaluation.',
    action: 'Document ATO pathway or obtain waiver before submission.',
    dq: true,
  },
  {
    id: 'RF-002',
    severity: 'HIGH',
    title: 'NIST SP 800-171 Score Not Posted in SPRS',
    detail: 'Cybersecurity score must be active in the Supplier Performance Risk System (SPRS) at time of submission. Unscored vendors are auto-rejected.',
    action: 'Complete self-assessment and post score to SPRS immediately.',
    dq: true,
  },
  {
    id: 'RF-003',
    severity: 'MEDIUM',
    title: 'Past Performance Threshold — $5M+ References Required',
    detail: 'Section L.2.1 requires a minimum of 3 references with contract values exceeding $5M in the last 5 years. Only 2 qualifying references identified in submitted materials.',
    action: 'Identify and prepare a third qualifying past performance reference.',
    dq: false,
  },
  {
    id: 'RF-004',
    severity: 'MEDIUM',
    title: 'PIEE Portal Submission Window Constraint',
    detail: 'Submissions must be uploaded via the Procurement Integrated Enterprise Environment (PIEE) portal. System maintenance windows may affect timely submission.',
    action: 'Register on PIEE and confirm submission window availability.',
    dq: false,
  },
  {
    id: 'RF-005',
    severity: 'MEDIUM',
    title: 'PII/PHI Data Handling Procedures Unspecified',
    detail: 'RFP explicitly requests procedures for handling PII/PHI within DoD network environments. Current proposal draft lacks a dedicated data handling section.',
    action: 'Add data handling procedures section to Technical Approach volume.',
    dq: false,
  },
];

const severityColor = { HIGH: 'var(--risk-high)', MEDIUM: 'var(--risk-medium)' };
const severityBg    = { HIGH: 'rgba(239,68,68,0.08)', MEDIUM: 'rgba(245,158,11,0.06)' };
const severityBorder= { HIGH: 'rgba(239,68,68,0.2)',  MEDIUM: 'rgba(245,158,11,0.18)' };

const RiskFlags = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.15s' }}>
    <div className="card-header">
      <AlertTriangle size={14} color="var(--risk-high)" />
      <span className="card-label">Risk Flags & Required Actions</span>
      <span style={{
        marginLeft: 'auto', fontSize: '10px', fontWeight: 700,
        background: 'rgba(239,68,68,0.12)', color: 'var(--risk-high)',
        border: '1px solid rgba(239,68,68,0.25)',
        padding: '2px 8px', borderRadius: '3px', letterSpacing: '0.08em',
      }}>{flags.length} FLAGS · 2 BID-KILLERS</span>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {flags.map(({ id, severity, title, detail, action, dq }, i) => (
        <div key={id} className="animate-in" style={{
          animationDelay: `${0.05 * i}s`,
          padding: '12px 14px',
          background: severityBg[severity],
          border: `1px solid ${severityBorder[severity]}`,
          borderLeft: `3px solid ${severityColor[severity]}`,
          borderRadius: '5px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
              color: severityColor[severity], flexShrink: 0, marginTop: '2px',
              background: severity === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)',
              padding: '2px 7px', borderRadius: '2px',
            }}>{severity}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {dq && <span style={{ fontSize: '9px', color: 'var(--risk-high)', fontWeight: 700, marginRight: '6px', background: 'rgba(239,68,68,0.15)', padding: '1px 5px', borderRadius: '2px' }}>⛔ BID-KILLER</span>}
                {title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>{detail}</div>
            </div>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', flexShrink: 0 }}>{id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
            <ArrowRight size={11} color="var(--accent)" />
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 500 }}>{action}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RiskFlags;
