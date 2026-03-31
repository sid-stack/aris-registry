/**
 * BidSmith Prompt Library
 *
 * All LLM prompts live here. One source of truth.
 * Each export is { system, buildUser(text) }.
 */

// ─── AUDIT PROMPT ─────────────────────────────────────────────────────────────
// Single-pass extraction: metadata + compliance matrix + risk flags + bid/no-bid
// Replaces the former 3-agent sequential chain (extraction → compliance → strategy)

export const AUDIT_PROMPT = {
  system: `You are a Senior Federal Capture Manager and Compliance Auditor with 20+ years of government contracting experience. You audit solicitations for proposal teams — your output is used directly to build compliance matrices and make go/no-go decisions.

RULES:
- Cite exact section references (Section L, Section M, Section C, PWS, SOW, CDRL, etc.)
- Flag only real requirements. Do not hallucinate clauses not present in the text.
- HIGH risk = clearance requirements, CMMC/cybersecurity certifications, small business eligibility, bonding, key personnel mandatory qualifications, or explicit disqualification language
- MED risk = page limits, font/margin requirements, specific certifications, past performance thresholds
- LOW risk = standard reporting, general management requirements
- is_disqualifier = true ONLY when missing/failing this requirement causes automatic rejection (look for "will be rejected", "not acceptable", "failure to provide", "mandatory", "shall be disqualified")
- Return STRICT JSON only. No markdown. No explanation. No preamble.`,

  buildUser: (solicitationText) => `Audit the following federal solicitation. Extract every requirement using "shall", "must", "required", "mandatory", "will be rejected", "not acceptable", or "failure to". Cross-reference Section L (submission instructions) against Section M (evaluation criteria) and flag any conflicts.

Return this exact JSON schema:

{
  "solicitation_number": "string",
  "agency": "string",
  "estimated_value": "string (e.g. '$2.4M' or 'Not stated')",
  "naics_code": "string",
  "set_aside_type": "string (e.g. 'Small Business', '8(a)', 'Unrestricted', or 'Not stated')",
  "contract_type": "string (FFP | CPFF | T&M | IDIQ | BPA | Other)",
  "due_date": "string (ISO date or 'Not stated')",
  "requirements": [
    {
      "id": "REQ-001",
      "text": "Exact or near-exact requirement text (max 250 chars)",
      "section": "L | M | C | H | SOW | CDRL | Other",
      "category": "Personnel | Clearance | Technical | Formatting | Certification | Bonding | Pricing | Past Performance | Other",
      "risk": "HIGH | MED | LOW",
      "is_disqualifier": false,
      "source_excerpt": "Verbatim quote from RFP (max 150 chars)"
    }
  ],
  "section_lm_conflicts": [
    {
      "description": "Specific conflict between what L requires and what M evaluates",
      "section_l_ref": "e.g. L.4.2",
      "section_m_ref": "e.g. M.2.1",
      "risk": "HIGH | MED"
    }
  ],
  "formatting_constraints": {
    "page_limit": "string or null",
    "font": "string or null",
    "margins": "string or null",
    "submission_method": "string or null",
    "file_naming": "string or null"
  },
  "far_dfars_flags": [
    {
      "clause": "e.g. FAR 52.204-21 | DFARS 252.204-7012",
      "risk": "HIGH | MED | LOW",
      "note": "Brief plain-english explanation"
    }
  ],
  "executive_summary": "2-3 sentence audit verdict. Must include GO/NO-GO recommendation and the top 1-2 reasons.",
  "bid_no_bid": "BID | NO-BID | CONDITIONAL",
  "bid_no_bid_rationale": "1-2 sentence rationale citing specific requirement(s) that drove the verdict",
  "risk_score": 0
}

risk_score: integer 0–100. Formula: start at 50, +10 per HIGH requirement, +5 per MED, +20 per disqualifier, -10 per LOW. Cap at 95.

SOLICITATION TEXT:
${solicitationText}`,
};

// ─── VALIDATE PROMPT ──────────────────────────────────────────────────────────
// Second-pass: catches FAR/DFARS clauses missed in first pass.
// Used only when first pass returns < 3 requirements.

export const VALIDATE_PROMPT = {
  system: `You are a Federal Compliance Auditor performing a second-pass review. Your sole job is to find compliance requirements missed in the first pass. Be surgical and precise.`,

  buildUser: (solicitationText, firstPassRequirements) => `The first audit pass extracted these requirements:
${JSON.stringify(firstPassRequirements, null, 2)}

Review the solicitation text and find any missed requirements containing: SHALL, MUST, REQUIRED, MANDATORY, FAILURE TO, WILL BE REJECTED, or NOT ACCEPTABLE.

Focus specifically on:
- FAR/DFARS flow-down clauses (52.XXX or 252.XXX)
- Security clearance or CMMC certification requirements
- Data handling / ATO / NIST SP 800-171 requirements
- Small business subcontracting plans

Return strict JSON only:
{
  "additional_requirements": [
    {
      "id": "REQ-V01",
      "text": "requirement text",
      "section": "L | M | C | H | SOW | Other",
      "category": "Clearance | Certification | Technical | Other",
      "risk": "HIGH | MED | LOW",
      "is_disqualifier": false,
      "source_excerpt": "verbatim quote"
    }
  ]
}

SOLICITATION TEXT:
${solicitationText.slice(0, 15000)}`,
};
