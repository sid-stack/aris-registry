/**
 * Sovereign Executive Brief Generator
 * Formats machine intelligence into boardroom-ready strategic audits.
 */

export function generateExecutiveBrief(auditResult, winThemes, patterns = []) {
  const { score, status, threats = [], summary = "" } = auditResult;
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  const banner = status === "PASS" ? "✅ GO / NO-GO: GO" : "❌ GO / NO-GO: NO-GO";
  
  return `
# SOVEREIGN STRATEGIC AUDIT v2.1
**Date:** ${date}
**Security Classification:** CUI // PROPIN (De-identified)

---

## I. EXECUTIVE SUMMARY: THE "KILL-SWITCH"
${banner}

**Strategic Quotient Score:** ${score}/100

**Core Assessment:**
${summary || "This solicitation presents a standard risk profile. Strategic alignment is recommended."}

### Critical Risk Flags
${threats.length > 0 ? threats.map(t => `- **[CRITICAL]** ${t}`).join('\n') : "- No immediate disqualifiers detected."}

---

## II. INSTITUTIONAL LOGIC APPLIED
*The following patterns were identified and mitigated from the ARIS Logic_Library.*

| Pattern ID | Conflict Description | Strategic Impact |
| :--- | :--- | :--- |
${patterns.map(p => `| **${p.id}** | ${p.name} | High - Logic extracted from ${p.source} |`).join('\n')}
${patterns.length === 0 ? "| **#PAT-NONE** | No specific agency conflicts detected. | Low |" : ""}

---

## III. THE POWER PLAYS: WIN-THEMES
*Strategic counter-measures designed to exploit logical contradictions.*

### 1. ${winThemes[0]?.title || "The Compliance Advantage"}
> **The Move:** ${winThemes[0]?.move || "Prioritize Section M evaluation criteria over Section L instructions."}
> **The Win:** Discredits competitors who follow 'Standard' response templates.

### 2. ${winThemes[1]?.title || "The Federal Intelligence Bridge"}
> **The Move:** ${winThemes[1]?.move || "Inject NIST 800-171 Rev 3 compliance ahead of the mandatory deadline."}
> **The Win:** Demonstrates 'Over-Compliance' as a strategic differentiator.

### 3. ${winThemes[2]?.title || "The Technical Ghosting Strategy"}
> **The Move:** ${winThemes[2]?.move || "Implicitly highlight the latency issues of 'Monolithic' legacy systems."}
> **The Win:** Positions your 'Modular' approach as the only viable long-term solution.

---

## IV. COMPLIANCE MATRIX (FAR/DFARS)
*Direct mappings to Federal Acquisition Regulations.*

*Note: Full matrix available in the detailed RTM export.*

---
**SOVEREIGN PROTOCOL**
*Machine Intelligence. Human Strategy.*
`;
}
