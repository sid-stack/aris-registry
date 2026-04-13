# BidSmith — Report & Dashboard Product Brief
**For:** Sid (Founder) + AI Engineer
**Date:** April 1, 2026
**Focus:** What the client sees. What makes them never leave.

---

## The Core Insight

Federal contractors don't want a compliance checklist.
They want someone to sit across the table and say:

> *"This one's wired for Booz Allen. Here's why. Skip it."*
> *"This one — you're a 9/10 fit. Here's exactly how to win."*

That's what BidSmith's report needs to feel like.
Not a tool. A **senior capture manager in their pocket.**

---

## Who's Reading This

- **Capture Manager** — Has 6 bids open simultaneously. Needs to cut 3 of them today.
- **BD Director** — Justifying pursuit decisions to leadership. Needs the *why.*
- **Proposal Manager** — 72 hours to submission. Needs a battle plan, not a list.
- **Small Business Owner/CEO** — Wearing all 3 hats above. No time. Needs a verdict.

All 4 personas share one question: **"Should I spend the next 200 hours on this?"**

---

## The Report: 4 Panels

---

### PANEL 1 — The Verdict Card
*First thing they see. Biggest real estate on the page.*

```
┌─────────────────────────────────────────────────────┐
│  ██ BID          ◐ CONDITIONAL        ░░ NO-BID      │
│                                                      │
│   WIN PROBABILITY                                    │
│   ████████████░░░░░  68%                            │
│                                                      │
│   "Strong technical fit. One gap: CMMC Level 2      │
│    certification not yet in place. If you can        │
│    partner or certify within 60 days — bid."         │
│                                                      │
│   RISK SCORE    74 / 100   [HIGH]                   │
│   DEADLINE      Apr 28, 2026  (27 days)             │
│   ESTIMATED VALUE  $4.2M                            │
└─────────────────────────────────────────────────────┘
```

**LLM does:**
- Reads the full solicitation and gives a plain-English verdict
- Calculates win probability from: set-aside type + requirements gap + agency history + competition signals
- Writes a 2-sentence rationale a CEO can read in 10 seconds
- Flags if this looks like a sole-source conversion or wired competition

---

### PANEL 2 — Intelligence Signals
*What the LLM reads between the lines. The stuff no one else surfaces.*

**Six signal blocks:**

#### 🎯 Competition Intelligence
```
INCUMBENT DETECTED — Medium Confidence
Language pattern: "continuation of existing services" + "familiarity
with current architecture" suggests incumbent has advantage.
Known active vendor in this space: SAIC, Leidos, Peraton
Recommendation: Price aggressively or highlight transition capability.
```

#### 🔴 Wired Contract Detector
```
FAIR & OPEN — High Confidence
No anomalous specificity in requirements. Evaluation criteria
are broad and favor new entrants. Solicitation language is neutral.
```
*(vs. flagging: "POSSIBLE SOLE SOURCE: requirements mention specific
proprietary tool 4 times. Strongly suggests pre-selected vendor.")*

#### 💰 Price-to-Win Signal
```
Estimated Competitive Range: $3.8M — $5.1M
Based on: CLIN structure, labor categories (8 FTEs implied),
12-month PoP with 2 option years, comparables on SAM.gov.
Watch: Section B CLIN 0003 (Travel) has no cap — competitors
will undercut here. Price it low.
```

#### 👥 Team Composition Signal
```
TEAMING RECOMMENDED
Requirements imply: 1x Program Manager (PMP), 2x cleared developers
(Secret), 1x ISSO. You likely need a teaming partner for clearances
unless your staff is already cleared.
Small business set-aside (8(a)) — prime must be 8(a) certified.
```

#### ⏱ Timeline Pressure Signal
```
RUSHED SOLICITATION
Posted → Due: 14 days (industry avg: 30 days)
Likely cause: End-of-fiscal-year spend, pre-existing relationship,
or sole-source that had to be competed. Proceed with caution.
```

#### 🧩 Evaluation Reality Check
```
STATED vs ACTUAL WEIGHT (LLM analysis)
Stated:  Technical 40% / Past Perf 30% / Price 30%
Actual:  Section M language uses "paramount" for past performance
         3x, "acceptable" for technical 2x.
         Real weight likely: Past Perf 50% / Price 30% / Technical 20%
Implication: Win or lose on past performance narratives.
```

---

### PANEL 3 — Compliance Matrix
*The core product. Upgraded from current version.*

**Current:** Table of requirements with risk flags.
**Upgraded:**

```
┌──────┬─────────────────────────────┬──────────┬──────────┬───────────┬──────────────────────────────┐
│  ID  │ Requirement                 │ Section  │ Category │   Risk    │ Your Gap                     │
├──────┼─────────────────────────────┼──────────┼──────────┼───────────┼──────────────────────────────┤
│ R001 │ CMMC Level 2 certification  │ Section H│ Security │ 🔴 HIGH  │ Not certified — 60-day gap   │
│ R002 │ 5 years past performance    │ Section L│ Past Perf│ 🟡 MED   │ You have 3 years on file     │
│ R003 │ Secret clearance all staff  │ Section H│ Clearance│ 🔴 HIGH  │ 2 of 4 staff cleared         │
│ R004 │ CAGE code at submission     │ Section L│ Admin    │ 🟢 LOW   │ ✓ You have this              │
└──────┴─────────────────────────────┴──────────┴──────────┴───────────┴──────────────────────────────┘
```

**New columns:**
- **Your Gap** — LLM-generated, reads your company profile if provided, or asks on first use
- **Action Required** — one-line fix: "Get teaming partner with CMMC Level 2"
- **Disqualifier badge** — hard red pill: "MISS THIS = AUTO-REJECT"

**Section L/M Cross-Reference:**
```
⚠️ CONFLICT DETECTED
Section L requires a 15-page Technical Approach (L.3.2)
Section M only evaluates Technical Approach at 20% weight
Implication: Don't over-invest in Section L technical narrative.
```

**FAR/DFARS Clause Explainer:**
Each flagged clause gets a plain-English translation:
```
DFARS 252.204-7012 — Safeguarding Covered Defense Information
What it means: You must have a documented cybersecurity plan (NIST 800-171),
incident reporting within 72 hours, and cloud services must be FedRAMP authorized.
Your risk: HIGH — if you use AWS standard, not GovCloud, this is a violation.
```

---

### PANEL 4 — Action Plan
*The capture manager's battle plan. Personalized to the deadline.*

```
┌─────────────────────────────────────────────────────────────────┐
│  27 DAYS TO SUBMISSION — Apr 28, 2026                          │
│                                                                 │
│  WEEK 1 (Today → Apr 8)                                        │
│  ☐ Submit questions via SAM.gov Q&A (deadline: Apr 7)          │
│  ☐ Identify CMMC Level 2 teaming partner                       │
│  ☐ Pull 3 past performance references (CPARS preferred)        │
│                                                                 │
│  WEEK 2 (Apr 8 → Apr 15)                                       │
│  ☐ Draft Technical Approach (15 pages per Section L.3.2)       │
│  ☐ Confirm teaming agreement signed                            │
│  ☐ Begin staffing plan with cleared personnel                  │
│                                                                 │
│  WEEK 3 (Apr 15 → Apr 22)                                      │
│  ☐ Complete price build (watch CLIN 0003 travel)               │
│  ☐ Executive Summary draft                                      │
│  ☐ Internal red team review                                    │
│                                                                 │
│  FINAL WEEK (Apr 22 → Apr 28)                                  │
│  ☐ Compliance check against Section L checklist               │
│  ☐ Format validation (page limits, font, margin)               │
│  ☐ Submit via SAM.gov by 4pm ET Apr 28                        │
└─────────────────────────────────────────────────────────────────┘
```

**Questions to Submit (LLM-generated, pre-written):**
```
Suggested Q&A Submissions (due Apr 7):

Q1: "Section L.3.2 requires 15 pages for Technical Approach. Does this
     include graphics and tables, or text only?"

Q2: "DFARS 252.204-7012 is cited. Does 'cloud services' include
     collaboration tools like Microsoft Teams/SharePoint Online?"

Q3: "Is prior experience with [specific agency] preferred or required
     for past performance evaluation under Section M.2?"
```

---

## The Dashboard (Home View)

When a contractor logs in, they see their **Pipeline** — all active pursuits in one view.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BIDSMITH PIPELINE                                    + Add Opportunity  │
├──────────────────────┬────────┬────────┬──────────┬────────┬────────────┤
│ Opportunity          │ Agency │  Value │  Fit     │  Days  │   Status   │
├──────────────────────┼────────┼────────┼──────────┼────────┼────────────┤
│ IT Modernization     │  DHS   │ $4.2M  │  ████ 68%│   27   │  PURSUING  │
│ Cyber SOC Support    │  DoD   │ $1.8M  │  ██░░ 45%│    6   │ ⚠ AT RISK  │
│ Cloud Migration      │  VA    │ $12M   │  ███░ 72%│   45   │  REVIEWING │
│ Help Desk Services   │  GSA   │ $800K  │  ░░░░ 22%│    3   │  NO-BID    │
└──────────────────────┴────────┴────────┴──────────┴────────┴────────────┘

PIPELINE SUMMARY
Active Bids: 3    Total Value: $18M    Avg Fit Score: 62%    Win Rate (YTD): 0%
```

**Smart alerts on the dashboard:**
- 🔴 "Cyber SOC deadline in 6 days — proposal not started"
- 🟡 "IT Modernization Q&A deadline tomorrow — 3 questions pre-written, review now"
- 🟢 "Cloud Migration: amendment posted — 2 new requirements added"

---

## What Makes This Different from Anything Else

| Feature | GovWin IQ | Deltek | BidSmith |
|---------|-----------|--------|---------|
| Compliance matrix | ✗ | ✗ | ✓ |
| Bid/No-Bid verdict | Manual | Manual | ✓ AI |
| Win probability | ✗ | ✗ | ✓ AI |
| Wired contract detection | ✗ | ✗ | ✓ AI |
| Section L/M conflict analysis | ✗ | ✗ | ✓ AI |
| Price-to-win signals | ✗ | ✗ | ✓ AI |
| Action plan with timeline | ✗ | ✗ | ✓ AI |
| Pre-written Q&A submissions | ✗ | ✗ | ✓ AI |
| Plain-English FAR/DFARS | ✗ | ✗ | ✓ AI |
| Cost | $20K+/yr | $30K+/yr | $99/mo |

---

## What the LLM Prompt Needs to Extract (New Fields)

To power Panels 1, 2, and 4, the audit prompt needs to extract:

```json
{
  "verdict": "BID | NO-BID | CONDITIONAL",
  "win_probability": 68,
  "win_probability_rationale": "Strong technical fit but CMMC gap is material...",
  "risk_score": 74,

  "intelligence": {
    "incumbent_signal": { "detected": true, "confidence": "medium", "explanation": "..." },
    "wired_signal": { "detected": false, "confidence": "high", "explanation": "..." },
    "price_to_win": { "low": 3800000, "high": 5100000, "rationale": "..." },
    "team_signal": "TEAMING RECOMMENDED — clearance gap requires partner",
    "timeline_pressure": { "detected": true, "days_to_respond": 14, "explanation": "..." },
    "evaluation_reality": "Past performance likely weighted higher than stated..."
  },

  "section_lm_conflicts": ["..."],
  "suggested_questions": ["Q1: ...", "Q2: ...", "Q3: ..."],
  "action_plan": [
    { "week": 1, "tasks": ["Submit Q&A", "Find teaming partner"] },
    { "week": 2, "tasks": ["Draft technical approach"] }
  ],

  "requirements": [...],
  "far_dfars_flags": [...],
  "executive_summary": "...",
  "bid_no_bid": "CONDITIONAL"
}
```

---

## Build Order (What to Ship First)

**V1 — Already live (today):**
- Compliance matrix (requirements table)
- FAR/DFARS flags
- Bid/No-Bid recommendation
- Risk score
- Executive summary

**V2 — Next sprint (1 week):**
- Win probability with rationale
- Wired contract detector
- Incumbent signal
- Plain-English FAR/DFARS explainer
- "Your Gap" column in compliance matrix

**V3 — Sprint after (2 weeks):**
- Pipeline dashboard (multi-opportunity view)
- Action plan with timeline
- Pre-written Q&A submissions
- Price-to-win signal
- Section L/M conflict analyzer

**V4 — Growth feature (month 2):**
- Company profile (upload your capabilities statement → personalizes gap analysis)
- Amendment tracker (alert when SAM.gov posts changes to active pursuits)
- Win/loss tracker (closes the loop on bid decisions)

---

## One-Line Pitch for Each Feature

- **Wired detector:** "Find out in 30 seconds if the contract is already spoken for."
- **Win probability:** "Stop guessing. Know your odds before you spend 200 hours."
- **Price-to-win:** "Underbid and lose money. Overbid and lose the contract. We tell you the number."
- **Action plan:** "Your proposal timeline, auto-built from the solicitation."
- **Q&A suggestions:** "The questions that win contracts — pre-written for you."
- **Gap analysis:** "Not just what they want. What you're missing."
