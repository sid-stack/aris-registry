import React, { useState, useEffect } from 'react';
import { TableProperties, Loader2, Sparkles, AlertCircle, BookOpen, ChevronDown, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import '../../pages/SamRep.css';

const sampleMatrix = [
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

// Source citation tag — shows § reference and expands to show the excerpt
const MatrixSourceTag = ({ section, excerpt }) => {
  const [open, setOpen] = useState(false);
  if (!section || section === 'N/A') return null;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column' }}>
      <button
        onClick={(e) => { e.stopPropagation(); if (excerpt) setOpen(v => !v); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '9px', fontWeight: 700, color: 'var(--accent)', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 3, padding: '2px 6px', cursor: excerpt ? 'pointer' : 'default', fontFamily: 'monospace' }}
      >
        <BookOpen size={8} /> § {section}
        {excerpt && <ChevronDown size={8} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
      </button>
      {open && excerpt && (
        <span style={{ display: 'block', marginTop: 4, padding: '6px 8px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderLeft: '2px solid var(--accent)', borderRadius: 4, fontSize: 10, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, maxWidth: 280 }}>
          "{excerpt}"
        </span>
      )}
    </span>
  );
};

const MobileComplianceCard = ({ req, onDraft, draftingId, auditMode }) => {
  const [expanded, setExpanded] = useState(false);
  const s = statusConfig[req.status] || statusConfig.review;
  const isDrafting = draftingId === req.id;
  const flagged = auditMode && (req.risk === 'HIGH' || !req.source_excerpt);

  return (
    <div style={{
      background: flagged ? 'rgba(245,158,11,0.05)' : 'var(--card)',
      border: `1px solid ${flagged ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
      borderLeft: `3px solid ${flagged ? '#f59e0b' : riskColor[req.risk] || riskColor.MEDIUM}`,
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {isDrafting && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)', fontSize: '11px', letterSpacing: '0.1em' }}>
          AGENTIC DRAFTING...
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "monospace", fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>
            {req.id}
          </span>
          {flagged && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '9px', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em' }}>
              <AlertTriangle size={8} /> VERIFY
            </span>
          )}
        </div>
        <div style={{ fontSize: "10px", fontWeight: 700, color: s.color, border: `1px solid ${s.color}`, background: s.bg, padding: "4px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {s.label}
        </div>
      </div>

      <div style={{
        fontSize: "15px",
        color: "var(--text-primary)",
        lineHeight: "1.6",
        wordBreak: "break-word",
        display: expanded ? "block" : "-webkit-box",
        WebkitLineClamp: expanded ? "unset" : 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }}>
        {req.requirement}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-secondary)", alignItems: 'center' }}>
        <MatrixSourceTag section={req.section} excerpt={req.source_excerpt} />
        <span>•</span>
        <span><strong>Cat:</strong> {req.category}</span>
        <span>•</span>
        <span><strong>FAR:</strong> {req.farRef}</span>
        <span>•</span>
        <span style={{ color: riskColor[req.risk] || riskColor.MEDIUM }}><strong>Risk:</strong> {req.risk}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)", fontSize: "13px", color: "var(--text-secondary)" }}>
          <strong>Action: </strong>{req.action}
          {flagged && !req.source_excerpt && (
            <div style={{ marginTop: 6, fontSize: 11, color: '#f59e0b', fontStyle: 'italic' }}>
              No source excerpt available — AI inferred this requirement. Cross-check against original RFP before submission.
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            flex: 1,
            background: "var(--card-hover)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: "11px",
            fontWeight: "700",
            padding: "8px",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {expanded ? "Less ↑" : "More ↓"}
        </button>
        <button
          onClick={() => onDraft(req.id)}
          disabled={isDrafting}
          style={{
            flex: 2,
            background: "var(--accent)",
            border: "none",
            color: "white",
            fontSize: "11px",
            fontWeight: "800",
            padding: "8px",
            borderRadius: "4px",
            cursor: "pointer",
            letterSpacing: '0.05em'
          }}
        >
          GENERATE DRAFT
        </button>
      </div>
    </div>
  );
};

const ComplianceMatrix = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [draftingId, setDraftingId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawText, setRawText] = useState('');
  const [auditMode, setAuditMode] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDraft = (id) => {
    setDraftingId(id);
    setTimeout(() => {
      setDraftingId(null);
      alert(`[BIDSMITH] Draft volume generated for ${id}.\n\nSource: SAM.gov Solicitation Archive\nStrategy: Compliance-First Traceability\nStatus: Ready for review.`);
    }, 2500);
  };

  const generateMatrix = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-token') || localStorage.getItem('aris_authenticated')}`
        },
        body: JSON.stringify({ text: rawText })
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.matrix.map((m, i) => ({
          id: `REQ-${i + 1}`,
          requirement: m.requirement,
          section: m.section || 'N/A',
          category: m.category || 'General',
          farRef: m.far_ref || 'FAR Ref Pending',
          status: m.status || 'review',
          risk: (m.priority || 'MEDIUM').toUpperCase(),
          action: m.response_strategy || 'Review and document compliance.'
        })));
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayItems = items.length ? items : sampleMatrix;
  const requirementsCount = items.length ? items.length : sampleMatrix.length;

  return (
    <div className="dashboard-card animate-in" style={{ animationDelay: '0.1s' }}>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <TableProperties size={14} color="var(--accent)" />
        <span className="card-label">Compliance Matrix</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {requirementsCount} Requirements · FAR-Referenced
          </span>
          <button
            onClick={() => setAuditMode(v => !v)}
            title={auditMode ? 'Exit Audit Mode' : 'Audit Mode — highlight items AI is uncertain about'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '9px', fontWeight: 800, letterSpacing: '0.07em',
              color: auditMode ? '#f59e0b' : 'var(--text-secondary)',
              background: auditMode ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${auditMode ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
              borderRadius: 5, padding: '4px 9px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {auditMode ? <Eye size={9} /> : <EyeOff size={9} />}
            AUDIT MODE {auditMode ? 'ON' : 'OFF'}
          </button>
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '8px', display: 'block', letterSpacing: '0.08em' }}>
          PASTE SOLICITATION TEXT (SECTION L/M/H)
        </label>
        <textarea
          placeholder="Paste RFP text here to generate an institutional compliance matrix..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          style={{
            width: '100%',
            height: '140px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '14px',
            color: '#f8fafc',
            fontFamily: 'inherit',
            fontSize: '13px',
            resize: 'none',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          onClick={generateMatrix}
          disabled={loading || !rawText.trim()}
          style={{
            marginTop: '12px',
            padding: '10px 18px',
            background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? 'ANALYZING REQUIREMENTS...' : 'GENERATE COMPLIANCE MATRIX'}
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          padding: '10px',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {displayItems.length > 0 && (
        isMobile ? (
          <div className="compliance-mobile-stack" style={{ marginTop: '12px' }}>
            {displayItems.map((req) => (
              <MobileComplianceCard key={req.id} req={req} onDraft={handleDraft} draftingId={draftingId} auditMode={auditMode} />
            ))}
          </div>
        ) : (
          <div className="compliance-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '850px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Requirement', 'Section', 'Category', 'FAR Reference', 'Status', 'Risk', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '8px 10px', textAlign: 'left',
                      fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                      color: 'var(--text-secondary)', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '9px', fontWeight: 700, color: 'var(--accent)' }}>DRAFT</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((row) => {
                  const { id, requirement, section, category, farRef, status, risk, action, source_excerpt } = row;
                  const s = statusConfig[status] || statusConfig.review;
                  const isDrafting = draftingId === id;
                  const flagged = auditMode && (risk === 'HIGH' || !source_excerpt);
                  const rowBg = isDrafting
                    ? 'var(--accent-soft)'
                    : flagged
                      ? 'rgba(245,158,11,0.05)'
                      : 'transparent';
                  return (
                    <tr key={id} style={{
                      borderBottom: '1px solid var(--border)',
                      background: rowBg,
                      borderLeft: flagged ? '3px solid #f59e0b' : '3px solid transparent',
                    }}
                      onMouseEnter={e => !isDrafting && !flagged && (e.currentTarget.style.background = 'var(--card-hover)')}
                      onMouseLeave={e => !isDrafting && (e.currentTarget.style.background = rowBg)}
                    >
                      <td style={{ padding: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {id}
                          {flagged && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '8px', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 3, padding: '1px 4px' }}>
                              <AlertTriangle size={7} /> VERIFY
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 500, minWidth: '160px' }}>{requirement}</td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                        <MatrixSourceTag section={section} excerpt={source_excerpt} />
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{category}</td>
                      <td style={{ padding: '10px', color: 'var(--accent)', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '10px' }}>{farRef}</td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '3px', background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: riskColor[risk] || riskColor.MEDIUM }}>{risk}</span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)', fontSize: '11px', minWidth: '200px', lineHeight: 1.4 }}>{action}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDraft(id)}
                          disabled={isDrafting}
                          style={{
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            opacity: isDrafting ? 0.5 : 1
                          }}
                        >
                          {isDrafting ? '...' : 'DRAFT'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default ComplianceMatrix;
