import React from 'react';
import { Grid } from 'lucide-react';

const pillars = [
  { label: 'Solicitation ID',            value: 'DHANOISS022426',         status: 'verified',   note: 'Confirmed via SAM.gov' },
  { label: 'Deadline Date',              value: 'Apr 30, 2026',           status: 'verified',   note: 'Response Deadline' },
  { label: 'Set-Aside Type',             value: 'Small Business',         status: 'verified',   note: 'FAR 52.219-6 confirmed' },
  { label: 'Past Perf. Threshold',       value: '$5M · 3 refs · 5 yrs',  status: 'warning',    note: 'Only 2 refs identified' },
  { label: 'Technical Disqualifiers',    value: 'ATO / SPRS Required',    status: 'danger',     note: '2 critical gaps found' },
  { label: 'NAICS Code',                 value: '518210',                 status: 'verified',   note: 'Size standard: $47.0M' },
  { label: 'Bonding Requirements',       value: 'Not Required',           status: 'verified',   note: 'N/A per Section H' },
  { label: 'Security Clearance',         value: 'Secret / IL4',          status: 'warning',    note: 'Conditional — verify' },
];

const statusColors = {
  verified: { bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)',  dot: 'var(--success)',    label: '✓ VERIFIED' },
  warning:  { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', dot: 'var(--risk-medium)', label: '⚠ REVIEW'  },
  danger:   { bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)',  dot: 'var(--risk-high)',   label: '✗ CRITICAL'},
};

const VerificationGrid = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.1s' }}>
    <div className="card-header">
      <Grid size={14} color="var(--accent)" />
      <span className="card-label">7-Pillar Verification Grid</span>
    </div>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
      gap: '12px',
    }}>
      {pillars.map(({ label, value, status, note }) => {
        const s = statusColors[status];
        return (
          <div key={label} style={{
            padding: '12px 14px',
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: '5px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.13em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
              {label}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{value}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{note}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: s.dot, letterSpacing: '0.08em' }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default VerificationGrid;
