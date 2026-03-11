import React, { useState } from 'react';
import { FileText, FileCode, Loader } from 'lucide-react';

const ExportToolbar = ({ exportPDF }) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mdLoading, setMdLoading]   = useState(false);

  // ── PDF via html2pdf.js (imported dynamically to avoid ESM global issues) ──
  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element  = document.getElementById('dashboard-content');
      await html2pdf()
        .set({
          margin:      [10, 10, 10, 10],
          filename:    'BidSmith-Intelligence-Report.pdf',
          image:       { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0b1220' },
          jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } catch (err) {
      console.error('PDF export failed:', err);
      window.print();
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Markdown export — serialise key report data to .md ───────────────────
  const handleMarkdown = () => {
    setMdLoading(true);
    try {
      const md = `# BidSmith Intelligence Report
**Solicitation:** DHA Video Imaging Archive  
**Agency:** Defense Health Agency  
**Solicitation ID:** DHANOISS022426  
**Generated:** ${new Date().toUTCString()}  
**Analysis Runtime:** 83 seconds · Time Saved: ~14 hrs  

---

## 1. Risk Assessment
- **Overall Risk Score:** 87 / 100  
- **Bid Recommendation:** CONDITIONAL BID  
- **Confidence:** 92% · Clauses Flagged: 14  

---

## 2. BidSmith Intelligence Index™
| Metric | Score |
|---|---|
| Opportunity Score | 78 / 100 |
| Bid Probability | 63% |
| Est. Win Rate | 31% (w/o ATO) |
| Technical Alignment | 82 |
| Competitive Position | 67 |
| Compliance Readiness | 48 |
| Past Performance Fit | 74 |

---

## 3. Executive Summary
BidSmith analysis identified critical RMF compliance dependencies and Authority to Operate (ATO) requirements that could materially affect proposal eligibility. Several integration constraints with legacy systems introduce moderate operational risk.

---

## 4. Bid Recommendation: CONDITIONAL BID
Conditions required before bidding:
- Demonstrate RMF alignment
- Provide ATO pathway documentation at IL4 or above
- Confirm legacy system compatibility
- Post NIST SP 800-171 score to SPRS

---

## 5. Risk Flags & Bid-Killer Alerts

### ⛔ RF-001 — Authority to Operate (ATO) [HIGH / BID-KILLER]
Section M.3 mandates ATO at IL4+. Missing SPRS entry = automatic disqualification.  
**Action:** Document ATO pathway or obtain waiver before submission.

### ⛔ RF-002 — NIST SP 800-171 Score Not in SPRS [HIGH / BID-KILLER]
Cybersecurity score must be active in SPRS at time of submission.  
**Action:** Complete self-assessment and post score to SPRS immediately.

### ⚠️ RF-003 — Past Performance Threshold [MEDIUM]
Requires 3 references >$5M in last 5 years. Only 2 identified.  
**Action:** Identify and prepare a third qualifying reference.

### ⚠️ RF-004 — PIEE Portal Submission Window [MEDIUM]
Submissions must be via PIEE portal. Maintenance windows may affect timely upload.  
**Action:** Register on PIEE and confirm submission window.

### ⚠️ RF-005 — PII/PHI Data Handling Unspecified [MEDIUM]
RFP requests explicit PII/PHI procedures. Missing from current draft.  
**Action:** Add data handling section to Technical Approach volume.

---

## 6. Compliance Matrix (FAR Referenced)

| ID | Requirement | Section | Category | FAR Reference | Status | Risk |
|---|---|---|---|---|---|---|
| CM-01 | SAM.gov Registration | Admin | Eligibility | FAR 52.204-7 | ✅ Compliant | LOW |
| CM-02 | NIST SP 800-171 / SPRS | M.3 | Cybersecurity | DFARS 252.204-7012 | ❌ Non-Compliant | HIGH |
| CM-03 | Authority to Operate | M.3 | Technical | N/A | ⚠️ Conditional | HIGH |
| CM-04 | Small Business Set-Aside | H.1 | Eligibility | FAR 52.219-6 | ✅ Compliant | LOW |
| CM-05 | Past Performance (3 refs $5M+) | L.2.1 | Technical | FAR Part 15 | ⚠️ Conditional | MEDIUM |
| CM-06 | PII/PHI Data Handling | L.4.2 | Technical | N/A | ⚠️ Conditional | HIGH |
| CM-07 | NAICS Code Compliance | Cover | Eligibility | FAR Part 19 | ✅ Compliant | LOW |
| CM-08 | PIEE Portal Submission | L.6 | Compliance | FAR 52.212-1 | 🔍 Review | MEDIUM |
| CM-09 | Bid Bond Requirements | H.4 | Financial | FAR Part 28 | ✅ Compliant | LOW |
| CM-10 | Security Clearance | M.5 | Technical | N/A | ⚠️ Conditional | MEDIUM |
| CM-11 | Subcontracting Plan | H.8 | Compliance | FAR 52.219-9 | 🔍 Review | MEDIUM |
| CM-12 | FAR Clause Compliance | I | Legal | Various | ✅ Compliant | LOW |

---

## 7. Applicable Standards & Compliance Summary

| Standard | Category | Status | Coverage |
|---|---|---|---|
| NIST SP 800-53 Rev 5 | Cybersecurity | Action Required | 92% |
| NIST SP 800-171 | Cybersecurity | CRITICAL GAP | 0% |
| DFARS 252.204-7012 | Regulatory | CRITICAL GAP | 0% |
| FAR 52.219-6 | Eligibility | Compliant | 100% |
| HIPAA / HITECH | Healthcare | Action Required | 68% |
| DoD IL4 | Security Classification | CRITICAL GAP | 0% |
| FISMA (FIPS 199/200) | Cybersecurity | Action Required | 74% |
| FAR Part 15 | Proposal | Compliant | 100% |
| ISO 27001 | Cybersecurity | Recommended | 55% |
| CMMC 2.0 Level 2 | Cybersecurity | Action Required | 40% |
| Section 508 | Accessibility | Action Required | 80% |
| FAR 52.204-21 | Regulatory | Compliant | 100% |

---

*Generated by BidSmith Intelligence Engine · ARIS Protocol · bidsmith.pro*  
*Zero Fluff. High Conviction. Time Saved: ~14 hours.*
`;

      const blob = new Blob([md], { type: 'text/markdown' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'BidSmith-Intelligence-Report.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('MD export failed:', err);
    } finally {
      setMdLoading(false);
    }
  };

  const btnStyle = (loading) => ({
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '7px 14px',
    backgroundColor: 'var(--card)',
    color: loading ? 'var(--text-secondary)' : 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '5px',
    cursor: loading ? 'wait' : 'pointer',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    transition: 'all 0.15s',
    opacity: loading ? 0.6 : 1,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button style={btnStyle(pdfLoading)} onClick={handlePDF} disabled={pdfLoading}>
        {pdfLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={13} />}
        {pdfLoading ? 'Generating...' : 'Export PDF'}
      </button>

      <button style={btnStyle(mdLoading)} onClick={handleMarkdown} disabled={mdLoading}>
        {mdLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FileCode size={13} />}
        {mdLoading ? 'Exporting...' : 'Export .MD'}
      </button>
    </div>
  );
};

export default ExportToolbar;
