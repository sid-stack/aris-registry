import React from 'react';
import { Trophy, AlertOctagon } from 'lucide-react';

const winThemes = [
  { rank: 1, theme: 'Proven AI Development in Secure DoD Environments', detail: 'Demonstrated ATO attainment across IL2–IL6 environments with zero security incidents over 3 contracts.' },
  { rank: 2, theme: 'Deep FAR/DFARS Compliance Architecture',            detail: 'Proprietary compliance engine cross-references 1,200+ FAR clauses in real-time, reducing manual review time by ~14 hours per bid.' },
  { rank: 3, theme: 'Agile + DevSecOps Delivery Model',                  detail: 'CI/CD pipeline with automated STIG hardening and FedRAMP-aligned controls. Delivery velocity 20% above agency baseline.' },
  { rank: 4, theme: 'Healthcare Data (PII/PHI) Handling Expertise',      detail: 'HIPAA-compliant data workflows with end-to-end encryption and role-based access controls validated in prior DHA engagements.' },
];

const preSubRisks = [
  'Inaccessible ATO documentation — cannot determine current status without SPRS verification.',
  'Unknown contract vehicle type — IDIQ vs. standalone award affects teaming strategy.',
  'Subcontracting plan requirement unconfirmed — may trigger FAR 52.219-9 compliance.',
  'Evaluation methodology (LPTA vs. Best Value) not yet confirmed — may affect price strategy.',
];

const WinThemes = () => (
  <div className="dashboard-card animate-in" style={{ animationDelay: '0.2s' }}>
    <div className="card-header">
      <Trophy size={14} color="var(--accent)" />
      <span className="card-label">Win Themes</span>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {winThemes.map(({ rank, theme, detail }) => (
        <div key={rank} style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '12px 14px',
          background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.12)',
          borderRadius: '5px',
        }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, color: 'var(--accent)',
          }}>{rank}</div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>{theme}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{detail}</div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
        <AlertOctagon size={13} color="var(--risk-medium)" />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--risk-medium)', textTransform: 'uppercase' }}>Pre-Submission Risk Flags</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {preSubRisks.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--risk-medium)', fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>⚡</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default WinThemes;
