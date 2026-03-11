import React from 'react';
import { BookOpen, CheckCircle, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

const standards = [
  {
    id: 'NIST SP 800-53 Rev 5',
    category: 'Cybersecurity',
    status: 'required',
    coverage: 92,
    summary: 'Security and Privacy Controls for Information Systems. Required for all federal IT systems. 20 control families identified in this solicitation. High-impact baseline applies given PHI data scope.',
  },
  {
    id: 'NIST SP 800-171',
    category: 'Cybersecurity',
    status: 'critical',
    coverage: 0,
    summary: 'Protecting Controlled Unclassified Information (CUI) in non-federal systems. SPRS score must be active at time of submission. Currently unposted — automatic disqualification risk.',
  },
  {
    id: 'DFARS 252.204-7012',
    category: 'Regulatory',
    status: 'critical',
    coverage: 0,
    summary: 'Safeguarding Covered Defense Information. Requires adequate security on all systems processing covered defense information. Must be addressed explicitly in Technical Volume.',
  },
  {
    id: 'FAR 52.219-6',
    category: 'Eligibility',
    status: 'compliant',
    coverage: 100,
    summary: 'Total Small Business Set-Aside. Confirmed applicable. Offeror meets SBA size standard under NAICS 518210 ($47.0M). No action required.',
  },
  {
    id: 'HIPAA / HITECH',
    category: 'Healthcare',
    status: 'required',
    coverage: 68,
    summary: 'Health Insurance Portability and Accountability Act. Directly applicable given Defense Health Agency scope and video imaging archive containing patient-linked data. BAA execution likely required.',
  },
  {
    id: 'DoD IL4 (Impact Level 4)',
    category: 'Security Classification',
    status: 'critical',
    coverage: 0,
    summary: 'DoD Cloud Computing Security Requirements for Controlled Unclassified Information. ATO at IL4 minimum required per Section M.3. No current ATO documentation on file.',
  },
  {
    id: 'FISMA (FIPS 199 / 200)',
    category: 'Cybersecurity',
    status: 'required',
    coverage: 74,
    summary: 'Federal Information Security Modernization Act. System categorization under FIPS 199 required. Given PHI and DoD data scope, HIGH impact categorization is expected.',
  },
  {
    id: 'FAR Part 15',
    category: 'Proposal',
    status: 'compliant',
    coverage: 100,
    summary: 'Contracting by Negotiation. Best Value or LPTA determination pending. Proposal must include Technical, Management, and Price volumes per Section L formatting requirements.',
  },
  {
    id: 'ISO 27001',
    category: 'Cybersecurity',
    status: 'recommended',
    coverage: 55,
    summary: 'International standard for information security management systems. Not explicitly required but strengthens technical credibility. Certification or alignment statement recommended in proposal.',
  },
  {
    id: 'CMMC 2.0 Level 2',
    category: 'Cybersecurity',
    status: 'required',
    coverage: 40,
    summary: 'Cybersecurity Maturity Model Certification. Applicable to DoD contracts involving CUI. Third-party assessment may be required depending on final contract vehicle. Gap assessment recommended.',
  },
  {
    id: 'Section 508 (29 U.S.C. § 794d)',
    category: 'Accessibility',
    status: 'required',
    coverage: 80,
    summary: 'Accessibility requirements for federal electronic and information technology. Applies to any delivered software or web interfaces. VPAT documentation required at delivery.',
  },
  {
    id: 'FAR 52.204-21',
    category: 'Regulatory',
    status: 'compliant',
    coverage: 100,
    summary: 'Basic Safeguarding of Covered Contractor Information Systems. Minimum 15 security requirements apply to all contractor systems. Confirmed addressable with current controls.',
  },
];

const statusConfig = {
  compliant:   { icon: CheckCircle,   color: 'var(--success)',     label: 'COMPLIANT',   bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.15)' },
  required:    { icon: AlertTriangle, color: 'var(--risk-medium)', label: 'ACTION REQ.', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
  critical:    { icon: XCircle,       color: 'var(--risk-high)',   label: 'CRITICAL GAP',bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.18)' },
  recommended: { icon: Sparkles,      color: 'var(--accent)',      label: 'RECOMMENDED', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)' },
};

const categoryColors = {
  'Cybersecurity':           '#818cf8',
  'Regulatory':              '#38bdf8',
  'Eligibility':             'var(--success)',
  'Healthcare':              '#f472b6',
  'Security Classification': 'var(--risk-high)',
  'Proposal':                'var(--accent)',
  'Accessibility':           '#a3e635',
};

const TechnicalAppendix = () => (
  <div className="dashboard-card animate-in">
    <div className="card-header">
      <BookOpen size={14} color="var(--accent)" />
      <span className="card-label">Applicable Standards & Compliance Summary</span>
      <span style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '10px', color: 'var(--accent)',
        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
        padding: '2px 9px', borderRadius: '3px', fontWeight: 700, letterSpacing: '0.08em',
      }}>
        <Sparkles size={10} /> AI GENERATED
      </span>
    </div>

    {/* Summary callout */}
    <div style={{
      padding: '12px 14px', marginBottom: '16px',
      background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
      borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6,
    }}>
      BidSmith Intelligence Engine identified <strong style={{ color: 'var(--text-primary)' }}>12 applicable standards and regulatory frameworks</strong> for solicitation <strong style={{ color: 'var(--accent)' }}>DHANOISS022426</strong>. Of these, <strong style={{ color: 'var(--risk-high)' }}>3 represent critical compliance gaps</strong> that require immediate remediation, <strong style={{ color: 'var(--risk-medium)' }}>5 require action</strong> before submission, and <strong style={{ color: 'var(--success)' }}>4 are currently compliant</strong>. The DHA healthcare data scope triggers HIPAA/HITECH obligations in addition to standard DoD cybersecurity requirements.
    </div>

    {/* Standards grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
      {standards.map(({ id, category, status, coverage, summary }) => {
        const s = statusConfig[status];
        const Icon = s.icon;
        const catColor = categoryColors[category] || 'var(--text-secondary)';
        return (
          <div key={id} style={{
            padding: '12px 14px',
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: '5px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{id}</div>
                <span style={{
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                  color: catColor, textTransform: 'uppercase',
                }}>{category}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon size={11} color={s.color} />
                  <span style={{ fontSize: '9px', fontWeight: 700, color: s.color, letterSpacing: '0.08em' }}>{s.label}</span>
                </div>
                {status !== 'critical' && (
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                    Coverage: <strong style={{ color: s.color }}>{coverage}%</strong>
                  </div>
                )}
                {status === 'critical' && (
                  <div style={{ fontSize: '9px', color: 'var(--risk-high)', fontWeight: 700 }}>NOT MET</div>
                )}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{summary}</div>
            {status !== 'critical' && status !== 'compliant' && (
              <div style={{
                height: '3px', background: 'var(--border)', borderRadius: '2px',
                marginTop: '10px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${coverage}%`,
                  background: s.color, borderRadius: '2px',
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Footer note */}
    <div style={{
      marginTop: '16px', padding: '10px 14px',
      borderTop: '1px solid var(--border)',
      fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.6,
    }}>
      <strong style={{ color: 'var(--accent)' }}>Audit Note:</strong> This compliance summary was generated by the BidSmith Intelligence Engine based on solicitation text extraction and semantic analysis. Final determination of applicable regulations requires legal review. Time saved vs. manual extraction: <strong style={{ color: 'var(--success)' }}>~14 hours</strong>.
    </div>
  </div>
);

export default TechnicalAppendix;
