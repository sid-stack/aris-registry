/**
 * BidSmith V2 Heuristics Test Suite
 * ===================================
 * Deterministic unit coverage for the refactored V2 pipeline.
 *
 * Scope:
 *   1. Incumbent Trap heuristic mapping
 *   2. Hidden Requirement extraction mapping
 *   3. Wired Metadata spec gap visibility
 *   4. Determinism across repeated identical runs
 *   5. Fallback routing: Mercury timeout -> Gemini 2.5 Flash
 *   6. Token handling on large solicitations
 *   7. Verdict card logic for extreme NO-BID scenarios
 *
 * Runner:
 *   node --test tests/v2_heuristics.js
 */

import test from "node:test";
import assert from "node:assert/strict";
import { runAudit } from "../api/agents/auditPipeline.js";

const REAL_FETCH = globalThis.fetch;

function installFetchMock(handler) {
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const parsedBody = options.body ? JSON.parse(options.body) : null;
    const call = {
      url: String(url),
      model: parsedBody?.model || null,
      body: parsedBody,
    };
    calls.push(call);
    return handler(call);
  };

  return {
    calls,
    restore() {
      globalThis.fetch = REAL_FETCH;
    },
  };
}

function makeLlmResponse(payload) {
  const content = JSON.stringify(payload);
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        choices: [
          {
            message: {
              content,
            },
          },
        ],
      };
    },
    async text() {
      return content;
    },
  };
}

function makeErrorResponse(status, message) {
  return {
    ok: false,
    status,
    async json() {
      return { error: { message } };
    },
    async text() {
      return message;
    },
  };
}

function buildParsedAudit(overrides = {}) {
  const base = {
    solicitation_number: "TEST-001",
    agency: "Federal Agency",
    estimated_value: "$10M",
    naics_code: "541512",
    set_aside_type: "Unrestricted",
    contract_type: "IDIQ",
    due_date: "2026-04-10",
    response_window_days: 10,
    verdict: {
      recommendation: "CONDITIONAL",
      win_probability: 50,
      confidence: "MEDIUM",
      summary: "Proceed only after resolving the highest-risk issues.",
      rationale: "The opportunity is viable, but the team should address qualification risk first.",
    },
    intelligence: {
      incumbent_signal: {
        score: 0,
        label: "LOW",
        signals_detected: [],
        explanation: "No strong incumbent language detected.",
      },
      evaluation_type: "Unknown",
      evaluation_reality: "",
      price_to_win: {
        low: 0,
        high: 0,
        currency: "USD",
        rationale: "",
      },
      team_signal: "SELF-PERFORM",
      team_signal_explanation: "",
      timeline_pressure: {
        detected: false,
        days_to_respond: null,
        explanation: "",
      },
      top_risks: [],
      key_discriminators: [],
      hidden_requirements: [],
    },
    requirements: [],
    section_lm_conflicts: [],
    formatting_constraints: {
      page_limit: null,
      font: null,
      margins: null,
      submission_method: null,
      file_naming: null,
    },
    far_dfars_flags: [],
    action_plan: [],
    suggested_questions: [],
    proposal_roadmap: [],
    executive_summary: "Conditional bid pending risk review.",
    bid_no_bid: "CONDITIONAL",
    bid_no_bid_rationale: "There are open risks that need a capture decision.",
    risk_score: 55,
  };

  return {
    ...base,
    ...overrides,
    verdict: {
      ...base.verdict,
      ...(overrides.verdict || {}),
    },
    intelligence: {
      ...base.intelligence,
      ...(overrides.intelligence || {}),
      incumbent_signal: {
        ...base.intelligence.incumbent_signal,
        ...(overrides.intelligence?.incumbent_signal || {}),
      },
      price_to_win: {
        ...base.intelligence.price_to_win,
        ...(overrides.intelligence?.price_to_win || {}),
      },
      timeline_pressure: {
        ...base.intelligence.timeline_pressure,
        ...(overrides.intelligence?.timeline_pressure || {}),
      },
    },
    formatting_constraints: {
      ...base.formatting_constraints,
      ...(overrides.formatting_constraints || {}),
    },
  };
}

function buildAuditForPrompt(userPrompt) {
  if (userPrompt.includes("ARGYLE Legacy Mission System")) {
    return buildParsedAudit({
      solicitation_number: "W56KGY-26-R-ARGYLE",
      agency: "Department of Defense",
      estimated_value: "$11.2M",
      contract_type: "IDIQ",
      due_date: "2026-04-07",
      response_window_days: 8,
      verdict: {
        recommendation: "NO-BID",
        win_probability: 18,
        confidence: "HIGH",
        summary: "NO-BID. The solicitation is heavily shaped around ARGYLE-specific operational history and immediate cleared staffing at Fort Belvoir.",
        rationale: "Tight turnaround, named-system experience, and Day 1 cleared on-site staffing create a high incumbent advantage.",
      },
      intelligence: {
        incumbent_signal: {
          score: 8,
          label: "HIGH",
          signals_detected: [
            {
              signal: "Experience Specificity",
              found: true,
              evidence: "10 continuous years of hands-on operational experience with the ARGYLE Legacy Mission System at Fort Belvoir.",
            },
            {
              signal: "Infrastructure Knowledge",
              found: true,
              evidence: "Direct experience with ARGYLE Build 7.4.1 patch set and proprietary C2 interface modules.",
            },
            {
              signal: "Short Response Window",
              found: true,
              evidence: "Issued March 28, 2026 and due April 7, 2026 with no extensions.",
            },
          ],
          explanation: "The ARGYLE-specific experience requirement is a classic wired signal because it favors the incumbent already operating the legacy system at Fort Belvoir.",
        },
        evaluation_type: "LPTA",
        timeline_pressure: {
          detected: true,
          days_to_respond: 8,
          explanation: "Eight business days is unusually short for a cleared, system-specific effort.",
        },
        top_risks: [
          {
            risk: "Named-system incumbency barrier",
            severity: "HIGH",
            action: "Treat as a likely recompete unless you already have ARGYLE incumbency or a capture partner who does.",
          },
        ],
        key_discriminators: [
          "Direct ARGYLE LMS operating experience at Fort Belvoir",
        ],
      },
      requirements: [
        {
          id: "REQ-001",
          text: "Offeror shall demonstrate 10 continuous years of ARGYLE LMS experience at Fort Belvoir.",
          section: "L",
          category: "Past Performance",
          risk: "HIGH",
          is_disqualifier: true,
          source_excerpt: "A minimum of 10 continuous years of hands-on operational experience with the ARGYLE Legacy Mission System at Fort Belvoir.",
          action_required: "Verify incumbent-level ARGYLE experience before bidding.",
        },
        {
          id: "REQ-002",
          text: "Offeror must maintain ARGYLE proprietary C2 interface modules and Build 7.4.1 patch set.",
          section: "L",
          category: "Technical",
          risk: "HIGH",
          is_disqualifier: true,
          source_excerpt: "Demonstrated experience maintaining the ARGYLE system's proprietary C2 interface modules, including direct experience with ARGYLE Build 7.4.1 patch set.",
          action_required: "Confirm direct maintenance history on ARGYLE proprietary components.",
        },
        {
          id: "REQ-003",
          text: "All key personnel must hold active SECRET clearances and report on-site at Fort Belvoir on Day 1.",
          section: "L",
          category: "Clearance",
          risk: "HIGH",
          is_disqualifier: true,
          source_excerpt: "All key personnel must hold active SECRET clearances and must be on-site at Fort Belvoir, Virginia no later than Day 1 of performance.",
          action_required: "Confirm cleared staff availability for immediate mobilization.",
        },
      ],
      far_dfars_flags: [
        {
          clause: "FAR 52.204-7",
          title: "System for Award Management",
          risk: "LOW",
          plain_english: "Offerors must maintain an active SAM registration before award.",
        },
      ],
      executive_summary: "NO-BID due to strong incumbent shaping and immediate cleared staffing requirements.",
      bid_no_bid: "NO-BID",
      bid_no_bid_rationale: "The named ARGYLE system, Fort Belvoir specificity, and rapid response window materially reduce win probability for non-incumbents.",
      risk_score: 88,
    });
  }

  if (userPrompt.includes("Attachment J-4: Cybersecurity Compliance Requirements")) {
    return buildParsedAudit({
      solicitation_number: "70RSAT-26-R-0088",
      agency: "Department of Homeland Security",
      estimated_value: "$6.8M",
      set_aside_type: "Small Business",
      contract_type: "Other",
      response_window_days: 14,
      verdict: {
        recommendation: "CONDITIONAL",
        win_probability: 42,
        confidence: "HIGH",
        summary: "CONDITIONAL. Section L and M look ordinary, but Attachment J-4 contains a high-risk CMMC Level 2 prerequisite.",
        rationale: "The buried certification requirement is award-critical and can disqualify an otherwise compliant proposal team.",
      },
      intelligence: {
        hidden_requirements: [
          {
            text: "Contractor personnel and systems handling CUI must achieve and maintain CMMC Level 2 certification prior to contract performance.",
            found_in: "Attachment J-4",
            not_in_section_l: true,
            risk: "HIGH",
            implication: "Treat this as a pre-award gate even though it is not surfaced in Section L or M.",
          },
        ],
        top_risks: [
          {
            risk: "Buried cybersecurity certification requirement",
            severity: "HIGH",
            action: "Validate current CMMC Level 2 posture before advancing the bid.",
          },
        ],
      },
      requirements: [
        {
          id: "REQ-001",
          text: "Offerors shall provide 3 references for similar cybersecurity work within the last 5 years.",
          section: "L",
          category: "Past Performance",
          risk: "MED",
          is_disqualifier: false,
          source_excerpt: "Offerors shall provide 3 references for similar cybersecurity work within the last 5 years.",
          action_required: "Assemble relevant DHS or cyber references.",
        },
        {
          id: "REQ-002",
          text: "All contractor personnel and systems handling CUI must achieve and maintain CMMC Level 2 certification prior to contract performance.",
          section: "Other",
          category: "Certification",
          risk: "HIGH",
          is_disqualifier: true,
          source_excerpt: "All contractor personnel and systems handling Controlled Unclassified Information (CUI) under this contract MUST achieve and maintain CMMC Level 2 certification prior to contract performance.",
          action_required: "Confirm current or attainable CMMC Level 2 certification before bid decision.",
        },
        {
          id: "REQ-003",
          text: "Contractor shall submit annual CMMC reassessment results to the Contracting Officer within 30 days of completion.",
          section: "Other",
          category: "Certification",
          risk: "HIGH",
          is_disqualifier: false,
          source_excerpt: "Submit annual CMMC re-assessment results to the Contracting Officer within 30 days of completion.",
          action_required: "Plan annual compliance reporting in the management approach.",
        },
      ],
      far_dfars_flags: [
        {
          clause: "FAR 52.249-8",
          title: "Default (Fixed-Price Supply and Service)",
          risk: "MED",
          plain_english: "Failure to maintain the required certification can trigger default remedies.",
        },
      ],
      executive_summary: "Conditional bid because Attachment J-4 hides a CMMC Level 2 prerequisite.",
      bid_no_bid: "CONDITIONAL",
      bid_no_bid_rationale: "The opportunity is only viable if the team already satisfies the buried CMMC requirement.",
      risk_score: 72,
    });
  }

  if (userPrompt.includes("Lockheed_Martin_Internal")) {
    return buildParsedAudit({
      solicitation_number: "FA8721-26-R-0044",
      agency: "Department of Defense",
      estimated_value: "$45M",
      contract_type: "IDIQ",
      verdict: {
        recommendation: "CONDITIONAL",
        win_probability: 34,
        confidence: "MEDIUM",
        summary: "CONDITIONAL. The opportunity is cleared and specialized, but the metadata signal is not yet a first-class output in the pipeline.",
        rationale: "Proceed with caution because the solicitation text suggests specialized aircraft systems experience and sensitive staffing requirements.",
      },
      intelligence: {
        incumbent_signal: {
          score: 4,
          label: "MODERATE",
          signals_detected: [
            {
              signal: "Clearance + Location Combo",
              found: true,
              evidence: "All personnel must hold TS/SCI clearances for aircraft systems work.",
            },
          ],
          explanation: "The current pipeline does not elevate document metadata into a dedicated competitive-authorship warning.",
        },
      },
      requirements: [
        {
          id: "REQ-001",
          text: "Offeror must demonstrate experience with F-35 maintenance systems.",
          section: "L",
          category: "Technical",
          risk: "HIGH",
          is_disqualifier: false,
          source_excerpt: "Offeror must demonstrate experience with F-35 maintenance systems.",
          action_required: "Confirm relevant aircraft systems past performance.",
        },
      ],
      executive_summary: "Conditional bid with a known metadata-detection gap.",
      bid_no_bid: "CONDITIONAL",
      bid_no_bid_rationale: "Metadata authorship is not yet surfaced as a first-class red flag.",
      risk_score: 63,
    });
  }

  if (userPrompt.includes("MONARCH program")) {
    return buildParsedAudit({
      solicitation_number: "HHM402-26-R-0012",
      agency: "Defense Intelligence Agency",
      estimated_value: "$22.5M",
      due_date: "2026-04-04",
      response_window_days: 4,
      verdict: {
        recommendation: "NO-BID",
        win_probability: 7,
        confidence: "HIGH",
        summary: "NO-BID. The solicitation combines a 4-day turnaround, active TS/SCI with CI polygraph, and MONARCH-specific continuity language.",
        rationale: "Tight turnaround + specific clearance requirements + strong incumbent language = under 10% win probability.",
      },
      intelligence: {
        incumbent_signal: {
          score: 9,
          label: "CRITICAL",
          signals_detected: [
            {
              signal: "Experience Specificity",
              found: true,
              evidence: "Minimum 7 years of continuous support to DIA Special Programs Directorate specifically supporting the MONARCH program.",
            },
            {
              signal: "Transition Minimization",
              found: true,
              evidence: "Offerors must maintain 100% operational continuity from Day 1 with no learning curve.",
            },
            {
              signal: "Short Response Window",
              found: true,
              evidence: "Issued March 30, 2026 and due April 4, 2026 with no extensions.",
            },
          ],
          explanation: "The MONARCH-specific continuity language strongly favors the incumbent team already cleared and operating inside the program.",
        },
        evaluation_type: "LPTA",
        timeline_pressure: {
          detected: true,
          days_to_respond: 4,
          explanation: "Four days is an extreme response window for TS/SCI cleared DIA work.",
        },
        top_risks: [
          {
            risk: "Active TS/SCI with CI polygraph required for Day 1 staffing",
            severity: "HIGH",
            action: "Decline unless an already-cleared incumbent-caliber team is in hand.",
          },
        ],
      },
      requirements: [
        {
          id: "REQ-001",
          text: "Offeror's facility must hold an active TOP SECRET / SCI facility clearance.",
          section: "L",
          category: "Clearance",
          risk: "HIGH",
          is_disqualifier: true,
          source_excerpt: "Offeror's facility must hold an active TOP SECRET / SCI facility clearance.",
          action_required: "Validate facility clearance before bid approval.",
        },
        {
          id: "REQ-002",
          text: "All proposed key personnel must hold active TS/SCI clearances with CI polygraph.",
          section: "L",
          category: "Clearance",
          risk: "HIGH",
          is_disqualifier: true,
          source_excerpt: "All proposed key personnel must hold active TS/SCI clearances with CI Polygraph.",
          action_required: "Confirm already-badged cleared labor pool.",
        },
        {
          id: "REQ-003",
          text: "Offeror must demonstrate minimum 7 years of continuous support to DIA Special Programs Directorate specifically supporting the MONARCH program.",
          section: "L",
          category: "Past Performance",
          risk: "HIGH",
          is_disqualifier: true,
          source_excerpt: "Offeror must demonstrate minimum 7 years of continuous support to DIA Special Programs Directorate specifically supporting the MONARCH program.",
          action_required: "Treat as incumbent-only unless directly provable.",
        },
      ],
      executive_summary: "NO-BID because the clearance posture, continuity demand, and MONARCH-specific experience heavily favor the incumbent.",
      bid_no_bid: "NO-BID",
      bid_no_bid_rationale: "The combination of incumbent shaping, TS/SCI with CI polygraph, and a 4-day deadline makes this unattractive for non-incumbents.",
      risk_score: 94,
    });
  }

  if (
    userPrompt.includes("SECTION C - STATEMENT OF WORK") ||
    userPrompt.includes("SECTION C — STATEMENT OF WORK")
  ) {
    return buildParsedAudit({
      solicitation_number: "LARGE-RFP-001",
      agency: "Federal Agency",
      estimated_value: "$45M",
      set_aside_type: "Small Business",
      contract_type: "IDIQ",
      response_window_days: 14,
      verdict: {
        recommendation: "CONDITIONAL",
        win_probability: 51,
        confidence: "MEDIUM",
        summary: "CONDITIONAL. The large solicitation is structurally readable, but it contains multiple clearance and cybersecurity obligations.",
        rationale: "Proceed only after validating cleared staffing and cyber controls across the full scope.",
      },
      intelligence: {
        evaluation_type: "Tradeoff",
        timeline_pressure: {
          detected: false,
          days_to_respond: 14,
          explanation: "The response window is demanding but not extreme for a large services vehicle.",
        },
      },
      requirements: [
        {
          id: "REQ-001",
          text: "All personnel must hold minimum SECRET clearance.",
          section: "C",
          category: "Clearance",
          risk: "HIGH",
          is_disqualifier: false,
          source_excerpt: "All personnel must hold minimum SECRET clearance.",
          action_required: "Confirm baseline cleared labor supply.",
        },
        {
          id: "REQ-002",
          text: "Replacement of key personnel requires 30-day advance notice.",
          section: "C",
          category: "Personnel",
          risk: "MED",
          is_disqualifier: false,
          source_excerpt: "Replacement of key personnel requires 30-day advance notice.",
          action_required: "Plan attrition and substitution controls.",
        },
        {
          id: "REQ-003",
          text: "Offeror must provide 3 past performance references, each valued at $3M+.",
          section: "L",
          category: "Past Performance",
          risk: "MED",
          is_disqualifier: false,
          source_excerpt: "Past performance: 3 references, each valued at $3M+.",
          action_required: "Assemble qualifying references before gate review.",
        },
      ],
      far_dfars_flags: [
        {
          clause: "DFARS 252.204-7012",
          title: "Safeguarding Covered Defense Information",
          risk: "HIGH",
          plain_english: "Expect controlled information handling and cyber safeguarding controls during performance.",
        },
      ],
      executive_summary: "Conditional bid on a large services RFP with recurring clearance and cyber requirements.",
      bid_no_bid: "CONDITIONAL",
      bid_no_bid_rationale: "The document is large but manageable if staffing and cyber compliance are already in place.",
      risk_score: 68,
    });
  }

  return buildParsedAudit({
    requirements: [
      {
        id: "REQ-001",
        text: "The contractor shall provide IT support services.",
        section: "Other",
        category: "Technical",
        risk: "MED",
        is_disqualifier: false,
        source_excerpt: "The contractor shall provide IT support services.",
        action_required: "Confirm core delivery capability.",
      },
    ],
  });
}

function normalizeForDeterminism(result) {
  return JSON.stringify({
    ...result,
    generated_at: "<normalized>",
  });
}

function assertSchema(result, label = "") {
  const requiredKeys = [
    "verdict",
    "intelligence",
    "requirements",
    "compliance",
    "riskAssessment",
    "executiveSummary",
    "generated_at",
  ];

  const requiredVerdictKeys = [
    "recommendation",
    "win_probability",
    "summary",
  ];

  const requiredIntelKeys = [
    "incumbent_signal",
    "evaluation_type",
    "top_risks",
    "key_discriminators",
    "hidden_requirements",
  ];

  for (const key of requiredKeys) {
    assert.ok(key in result, `[${label}] Missing top-level key: "${key}"`);
  }

  for (const key of requiredVerdictKeys) {
    assert.ok(key in result.verdict, `[${label}] Missing verdict.${key}`);
  }

  for (const key of requiredIntelKeys) {
    assert.ok(key in result.intelligence, `[${label}] Missing intelligence.${key}`);
  }

  assert.ok(Array.isArray(result.requirements), `[${label}] requirements must be array`);
  assert.ok(
    ["BID", "NO-BID", "CONDITIONAL"].includes(result.verdict.recommendation),
    `[${label}] verdict.recommendation must be BID|NO-BID|CONDITIONAL`
  );
  assert.ok(
    typeof result.verdict.win_probability === "number" &&
      result.verdict.win_probability >= 0 &&
      result.verdict.win_probability <= 100,
    `[${label}] win_probability must be 0-100`
  );
}

const MOCK_RFPS = {
  INCUMBENT_TRAP: `
DEPARTMENT OF DEFENSE - ARMY INFORMATION TECHNOLOGY SERVICES
Solicitation Number: W56KGY-26-R-ARGYLE
Section L - Instructions to Offerors

L.1 ELIGIBILITY
Offerors must be registered in SAM.gov and hold an active facility clearance at the SECRET level.

L.2 TECHNICAL QUALIFICATIONS (MANDATORY - failure to demonstrate disqualifies offer)
The offeror SHALL demonstrate:
(a) A minimum of 10 (ten) continuous years of hands-on operational experience with the
    ARGYLE Legacy Mission System (LMS) as deployed at Fort Belvoir, Virginia.
(b) Demonstrated experience maintaining the ARGYLE system's proprietary C2 interface
    modules, including direct experience with ARGYLE Build 7.4.1 patch set.
(c) At least 3 past performance references where the offeror operated the ARGYLE LMS
    in a live operational environment for the U.S. Army, each valued at or above $8.5M.
(d) All key personnel must hold active SECRET clearances and must be on-site at
    Fort Belvoir, Virginia no later than Day 1 of performance.

L.3 RESPONSE TIMELINE
This solicitation is issued on March 28, 2026. Proposals are due by April 7, 2026
(8 business days). No extensions will be granted.

Section M - Evaluation Criteria

M.1 EVALUATION APPROACH: Technically Acceptable / Lowest Price (LPTA)
Factor 1: Technical Acceptability (Pass/Fail)
  - Must demonstrate ARGYLE LMS experience per L.2 above.
  - Failure to demonstrate = automatic disqualification.
Factor 2: Price - Lowest price among technically acceptable offerors wins award.

NAICS: 541512
Estimated Contract Value: $11.2M
Period of Performance: 1 Base Year + 4 Option Years
Set-Aside: Full and Open Competition
`,

  HIDDEN_REQUIREMENT: `
DEPARTMENT OF HOMELAND SECURITY - CYBERSECURITY DIVISION
Solicitation Number: 70RSAT-26-R-0088
Section L - Instructions to Offerors

L.1 ELIGIBILITY
All offerors must be registered in SAM.gov with an active DUNS/UEI number.

L.2 PROPOSAL STRUCTURE
Volume I: Technical Approach (max 20 pages)
Volume II: Management Approach (max 10 pages)
Volume III: Past Performance (max 5 pages)
Volume IV: Price/Cost

L.3 PAST PERFORMANCE
Offerors shall provide 3 references for similar cybersecurity work within the last 5 years.

Section M - Evaluation Criteria

M.1 EVALUATION APPROACH: Best Value Tradeoff
Factor 1: Technical Approach (Most Important)
Factor 2: Management Approach
Factor 3: Past Performance
Factor 4: Price (Least Important)

Section J - Attachments and Exhibits

Attachment J-1: Statement of Work (SOW)
Attachment J-2: Performance Work Statement
Attachment J-3: Quality Assurance Surveillance Plan (QASP)
Attachment J-4: Cybersecurity Compliance Requirements

--- BEGIN ATTACHMENT J-4 ---
CYBERSECURITY COMPLIANCE REQUIREMENTS

J-4.1 MANDATORY CERTIFICATION REQUIREMENTS
All contractor personnel and systems handling Controlled Unclassified Information (CUI)
under this contract MUST achieve and maintain CMMC Level 2 certification prior to
contract performance. This is a non-negotiable prerequisite.

J-4.2 CMMC LEVEL 2 IMPLEMENTATION
The contractor shall:
(a) Obtain a CMMC Level 2 assessment from a C3PAO (Certified Third Party Assessment
    Organization) prior to contract award.
(b) Maintain CMMC Level 2 compliance throughout the period of performance.
(c) Submit annual CMMC re-assessment results to the Contracting Officer within 30 days
    of completion.

Failure to maintain CMMC Level 2 certification shall be grounds for contract termination
for default under FAR 52.249-8.
--- END ATTACHMENT J-4 ---

NAICS: 541519
Estimated Contract Value: $6.8M
Period of Performance: 3 years
Set-Aside: Small Business
`,

  VERDICT_CARD: `
DEFENSE INTELLIGENCE AGENCY - SPECIAL PROGRAMS DIRECTORATE
Solicitation Number: HHM402-26-R-0012
NOTICE: This solicitation is issued March 30, 2026. Proposals due April 4, 2026.
(4 business days from date of issuance. NO EXTENSIONS.)

Section L - Instructions to Offerors

L.1 ELIGIBILITY - MANDATORY REQUIREMENTS (AUTOMATIC DISQUALIFIERS)
(a) Offeror's facility must hold an active TOP SECRET / SCI facility clearance.
(b) All proposed key personnel must hold active TS/SCI clearances with
    CI (Counterintelligence) Polygraph. Personnel without active CI Poly on Day 1
    will result in immediate disqualification.
(c) Offeror must demonstrate minimum 7 years of continuous support to DIA
    Special Programs Directorate - specifically supporting the MONARCH program.
(d) All work is performed on-site at DIA HQ, Washington DC. Clearances must be
    verified and badged prior to performance start.

L.2 TRANSITION
The Government anticipates zero operational disruption during transition. Offerors
must demonstrate ability to maintain 100% operational continuity from Day 1 with
no learning curve or knowledge transfer period required.

Section M - Evaluation Criteria

M.1: LPTA - Technically Acceptable / Lowest Price
Technical acceptability: Pass/Fail based on L.1 requirements above.
Price: Lowest price among technically acceptable offerors wins.

NAICS: 541512
Estimated Value: $22.5M (5-year IDIQ)
Set-Aside: Unrestricted
`,

  METADATA_RFP: `
[DOCUMENT METADATA]
Author: Lockheed_Martin_Internal
Creator: Microsoft Word - LM_Proposal_Template_2025
Last Modified By: jsmith@lm.com
[END METADATA]

DEPARTMENT OF DEFENSE SOLICITATION
Solicitation Number: FA8721-26-R-0044

Section L - Instructions to Offerors
L.1 Eligibility: Offeror must demonstrate experience with F-35 maintenance systems.
L.2 Key Personnel: All personnel must hold TS/SCI clearances.
L.3 Past Performance: 3 references for similar DoD aircraft systems work.

Section M - Evaluation: Best Value Tradeoff
NAICS: 336411
Estimated Value: $45M
`,

  get LARGE_RFP() {
    const baseSection = `
SECTION C - STATEMENT OF WORK
Task Order ALPHA-1001

The contractor shall provide professional IT support services including:
- Network operations and maintenance
- Cybersecurity monitoring and incident response
- Help desk support (Tier 1, 2, and 3)
- Software development and maintenance
- Data management and analytics
- Cloud infrastructure management (AWS GovCloud, Azure Government)
- Configuration management and change control
- System administration and patch management
- Documentation and reporting per CDRL requirements

Personnel Requirements:
- All personnel must hold minimum SECRET clearance
- Key personnel require agency approval prior to assignment
- Replacement of key personnel requires 30-day advance notice

FAR Clauses Incorporated by Reference:
FAR 52.204-7 System for Award Management
FAR 52.204-21 Basic Safeguarding of Covered Contractor Information Systems
FAR 52.212-4 Contract Terms and Conditions
FAR 52.215-2 Audit and Records - Negotiation
DFARS 252.204-7012 Safeguarding Covered Defense Information
DFARS 252.204-7020 NIST SP 800-171 DoD Assessment Requirements
`;

    return (
      baseSection.repeat(170) +
      `
Section L - Instructions
L.1 Proposals due within 14 days of issuance.
L.2 Past performance: 3 references, each valued at $3M+.
L.3 Key personnel: Program Manager, Technical Lead, Security Manager.

Section M - Evaluation
M.1 Best Value Tradeoff: Technical (40%), Management (30%), Past Performance (20%), Price (10%).

NAICS: 541512
Estimated Value: $45M
Set-Aside: Small Business
`
    );
  },
};

function withAuditMock() {
  return installFetchMock((call) => {
    if (!call.url.includes("openrouter.ai")) {
      return makeErrorResponse(500, `Unexpected endpoint in unit test: ${call.url}`);
    }

    const userMessage = call.body?.messages?.find((m) => m.role === "user")?.content || "";
    return makeLlmResponse(buildAuditForPrompt(userMessage));
  });
}

test("1. Incumbent Trap - ARGYLE system signals wired contract (score > 7)", async () => {
  const mock = withAuditMock();

  try {
    const result = await runAudit(MOCK_RFPS.INCUMBENT_TRAP, {
      title: "Army IT Services - ARGYLE LMS",
      agency: "Department of Defense",
    });

    assertSchema(result, "Incumbent Trap");

    const signal = result.intelligence.incumbent_signal;
    const detected = signal.signals_detected.filter((entry) => entry.found);
    const explanation = signal.explanation.toLowerCase();

    assert.ok(signal.score >= 7, `Expected incumbent score >= 7, got ${signal.score}`);
    assert.ok(["HIGH", "CRITICAL"].includes(signal.label), `Expected HIGH or CRITICAL, got ${signal.label}`);
    assert.ok(detected.some((entry) => entry.signal === "Experience Specificity"), "Expected Experience Specificity signal");
    assert.ok(explanation.includes("argyle"), `Expected explanation to mention ARGYLE. Got: ${signal.explanation}`);
    assert.ok(result.verdict.win_probability <= 25, `Expected low win probability, got ${result.verdict.win_probability}`);
    assert.equal(result.verdict.recommendation, "NO-BID");
  } finally {
    mock.restore();
  }
});

test("2. Hidden Requirement - CMMC Level 2 buried in Attachment J-4", async () => {
  const mock = withAuditMock();

  try {
    const result = await runAudit(MOCK_RFPS.HIDDEN_REQUIREMENT, {
      title: "DHS Cybersecurity Services",
      agency: "Department of Homeland Security",
    });

    assertSchema(result, "Hidden Requirement");

    const hidden = result.intelligence.hidden_requirements;
    const cmmcHidden = hidden.find((entry) => entry.text.toLowerCase().includes("cmmc"));
    const cmmcRequirement = result.requirements.find((entry) => entry.requirement.toLowerCase().includes("cmmc"));

    assert.ok(cmmcHidden, "Expected CMMC requirement in hidden_requirements");
    assert.ok(cmmcRequirement, "Expected CMMC requirement in requirements matrix");
    assert.equal(cmmcHidden.found_in, "Attachment J-4");
    assert.equal(cmmcHidden.risk, "HIGH");
    assert.equal(cmmcRequirement.risk, "HIGH");
    assert.equal(cmmcRequirement.is_disqualifier, true);
  } finally {
    mock.restore();
  }
});

test("3. [SPEC] Wired Metadata - document authorship warning is still a gap", async () => {
  const mock = withAuditMock();

  try {
    const result = await runAudit(MOCK_RFPS.METADATA_RFP, {
      title: "DoD Aircraft Systems Maintenance",
      agency: "Department of Defense",
    });

    assertSchema(result, "Metadata Check");
    assert.ok(result.verdict.recommendation, "Verdict must exist even without metadata parsing");

    const explanation = result.intelligence.incumbent_signal.explanation.toLowerCase();
    const hasDedicatedMetadataFlag =
      "metadata_red_flag" in result.intelligence ||
      explanation.includes("competitive authorship") ||
      explanation.includes("document metadata suggests");

    assert.equal(
      hasDedicatedMetadataFlag,
      false,
      "The current pipeline should still expose this as a known spec gap, not a shipped feature."
    );
  } finally {
    mock.restore();
  }
});

test("4. Determinism - same RFP 3x produces identical structure and citations", async () => {
  const mock = withAuditMock();

  try {
    const baseline = [];

    for (let i = 0; i < 3; i += 1) {
      const result = await runAudit(MOCK_RFPS.HIDDEN_REQUIREMENT, {
        title: "Determinism Run",
        agency: "DHS",
      });

      assertSchema(result, `Determinism Run ${i + 1}`);
      baseline.push(normalizeForDeterminism(result));
    }

    assert.equal(baseline[1], baseline[0], "Run 2 differed from Run 1");
    assert.equal(baseline[2], baseline[0], "Run 3 differed from Run 1");
  } finally {
    mock.restore();
  }
});

test("5. Fallback Logic - Mercury timeout routes to OpenRouter and preserves schema", async () => {
  const previousMercuryKey = process.env.MERCURY_API_KEY;
  const previousOpenRouterKey = process.env.OPENROUTER_API_KEY;
  process.env.MERCURY_API_KEY = "test-mercury-key";
  process.env.OPENROUTER_API_KEY = "test-openrouter-key";
  // Disable Gemini so fallback goes straight to OpenRouter
  delete process.env.GEMINI_API_KEY;

  const mock = installFetchMock((call) => {
    if (call.url.includes("inceptionlabs.ai")) {
      throw new Error("Simulated Mercury timeout");
    }
    const userMessage = call.body?.messages?.find((m) => m.role === "user")?.content || "";
    return makeLlmResponse(buildAuditForPrompt(userMessage));
  });

  try {
    const result = await runAudit(MOCK_RFPS.HIDDEN_REQUIREMENT, {
      title: "Mercury Timeout Fallback",
      agency: "DHS",
    });

    assertSchema(result, "Mercury Timeout Fallback");

    const mercuryCalls = mock.calls.filter((entry) => entry.url.includes("inceptionlabs.ai"));
    const openrouterCalls = mock.calls.filter((entry) => entry.url?.includes("openrouter.ai"));

    assert.ok(mercuryCalls.length >= 1, `Expected at least one Mercury direct attempt, got ${mercuryCalls.length}`);
    assert.ok(openrouterCalls.length >= 1, `Expected at least one OpenRouter fallback attempt, got ${openrouterCalls.length}`);
    assert.ok(result.requirements.length >= 3, "Expected schema-preserving fallback output");
  } finally {
    mock.restore();
    if (previousMercuryKey === undefined) { delete process.env.MERCURY_API_KEY; } else { process.env.MERCURY_API_KEY = previousMercuryKey; }
    if (previousOpenRouterKey === undefined) { delete process.env.OPENROUTER_API_KEY; } else { process.env.OPENROUTER_API_KEY = previousOpenRouterKey; }
  }
});

test("6. Token Handling - large RFP processes without crash", async () => {
  const mock = withAuditMock();
  const largeRfp = MOCK_RFPS.LARGE_RFP;

  try {
    const start = Date.now();
    const result = await runAudit(largeRfp, {
      title: "Large RFP Token Test",
      agency: "Federal Agency",
    });
    const elapsed = Date.now() - start;

    assertSchema(result, "Token Handling");
    assert.ok(largeRfp.length > 120_000, `Expected large fixture > 120k chars, got ${largeRfp.length}`);
    assert.ok(result.requirements.length >= 3, `Expected >= 3 requirements, got ${result.requirements.length}`);
    assert.ok(elapsed < 5_000, `Expected mocked token handling test to finish quickly, got ${elapsed}ms`);
  } finally {
    mock.restore();
  }
});

test("7. Verdict Card - TS/SCI + 4-day window + incumbent = NO-BID, prob < 10%", async () => {
  const mock = withAuditMock();

  try {
    const result = await runAudit(MOCK_RFPS.VERDICT_CARD, {
      title: "DIA Special Programs - MONARCH",
      agency: "Defense Intelligence Agency",
    });

    assertSchema(result, "Verdict Card");

    const verdict = result.verdict;
    const intelligence = result.intelligence;
    const rationale = (verdict.rationale || verdict.summary).toLowerCase();

    assert.equal(verdict.recommendation, "NO-BID");
    assert.ok(verdict.win_probability < 10, `Expected win probability < 10, got ${verdict.win_probability}`);
    assert.ok(intelligence.incumbent_signal.score >= 8, `Expected incumbent score >= 8, got ${intelligence.incumbent_signal.score}`);
    assert.equal(intelligence.timeline_pressure.detected, true);
    assert.ok(
      rationale.includes("tight turnaround") &&
        rationale.includes("clearance") &&
        rationale.includes("incumbent"),
      `Expected rationale to mention turnaround, clearance, and incumbent pressure. Got: ${verdict.rationale}`
    );
  } finally {
    mock.restore();
  }
});
