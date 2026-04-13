# BidSmith Dashboard & Report — Full Product Plan
**Audience:** SAM.gov government contractors — BD Directors, Capture Managers, CEOs of 20–200 person firms  
**Goal:** Replace the spreadsheet + gut instinct workflow with an intelligence-first system  
**Date:** April 1, 2026

---

## Current State vs. End State

| What Exists | What We're Building |
|-------------|---------------------|
| 3-tab workspace (Compliance, Drafting, Chat) | Full capture intelligence platform |
| Sample compliance matrix | Live, per-solicitation analysis |
| Basic proposal drafter | Full report + proposal roadmap |
| No pipeline tracking | Pipeline dashboard with win-weighted value |
| No opportunity discovery | Personalized opportunity feed with AI scoring |
| No competitive intelligence | Incumbent detection + likely competitor mapping |

---

## The Core Insight

**What contractors pay for isn't compliance matrices. It's confidence.**

The $50k question before every proposal is: "Do we actually have a shot at this?" Nobody sells that answer. GovWin tells you who won. FPDS tells you what was paid. But nobody reads the RFP and says: "This is wired — here's why. Don't bid."

That's BidSmith's moat. The LLM reads between the lines of every solicitation and gives you the confidence signal before you commit 200 hours.

---

## 1. DASHBOARD PLAN

### Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  BIDSMITH   [Pipeline]  [Discovery]  [Analytics]    [User]  [+] │ ← Top Nav
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  MY PIPELINE │           MAIN WORKSPACE                         │
│  ─────────── │           (context-aware)                        │
│  Active Bids │                                                   │
│  ─────────── │                                                   │
│  [Bid 1]  ●  │                                                   │
│  [Bid 2]  ●  │                                                   │
│  [Bid 3]  ●  │                                                   │
│  ─────────── │                                                   │
│  Quick Stats │                                                   │
│  Win Rate    │                                                   │
│  Pipeline $  │                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### Section 1: Pipeline Sidebar (Persistent Left Rail)

**What it shows:**
- List of all active solicitations the team is tracking
- Each bid shows: Agency, Solicitation name, Deadline countdown, Win probability badge
- Color coded: Green (Strong bid, 70%+), Yellow (Conditional, 40–70%), Red (No-bid risk, <40%)
- One-click to open full analysis for any bid

**Quick stats at bottom:**
- Active Bids: 7
- Win-Weighted Pipeline Value: $4.2M
- Win Rate (Last 12 months): 24%
- Bids Due This Week: 2

**Why contractors love this:** Right now this lives in a spreadsheet or a Deltek system that costs $800/mo. Seeing your whole pipeline with probability scores in one sidebar is an immediate "I need this."

---

### Section 2: Home / Pipeline Health (Default View)

**Top Row — 4 KPI Cards:**
```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  ACTIVE    │ │ WIN-WEIGHT │ │  WIN RATE  │ │ DUE < 7D  │
│   BIDS     │ │  PIPELINE  │ │  (90 DAY)  │ │ DEADLINES  │
│     7      │ │   $4.2M    │ │    24%     │ │     2      │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

**Deadline Calendar Strip (14 days):**
- Visual timeline of bid deadlines
- Each deadline has: Solicitation name, Agency, Days remaining, Completion % of proposal
- Red = < 5 days, Yellow = 5–10, Green = > 10

**Opportunity Feed Preview (right panel):**
- Top 3 new opportunities matching their NAICS/agency profile
- Each with: Title, Agency, Value, Set-aside, BidSmith Score
- "Analyze" button → opens full intelligence view

---

### Section 3: Opportunity Intelligence View (Per Solicitation — Core Experience)

This is the main product. When a contractor opens a solicitation, they see 5 tabs:

#### TAB 1: Intelligence Brief ← THE HOOK

This is what makes BidSmith different. LLM reads the full RFP and surfaces what a 20-year BD veteran would catch.

```
┌─────────────────────────────────────────────────────┐
│  ARMY — IT SERVICES INDEFINITE DELIVERY VEHICLE      │
│  NAICS: 541512  │  $12.4M  │  Due: Apr 14, 2026     │
│  Solicitation: W912EE-26-R-0042                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  WIN PROBABILITY          RECOMMENDATION             │
│  ████████░░  73%          [  ✓ BID  ]               │
│                                                      │
├──────────────────────────────────────────────────────┤
│  INCUMBENT SIGNAL SCORE: 4/10  ← LOW RISK            │
│  "No strong incumbent language detected"             │
│                                                      │
│  EVALUATION TYPE: Best Value (Technical-Led)         │
│  "Language weights technical 60%, price 40%"         │
│                                                      │
│  PRICE ESTIMATE RANGE: $9.8M – $13.1M               │
│  "Based on 4 prior awards at this agency (FPDS)"    │
├──────────────────────────────────────────────────────┤
│  TOP 3 RISKS            │  KEY DISCRIMINATORS        │
│  ⚠ SPRS score required  │  ✦ Cloud migration exp.   │
│  ⚠ TS/SCI key personnel │  ✦ Prior Army IT awards   │
│  ⚠ 8-day response window│  ✦ CMMC Level 2 certified │
└──────────────────────────────────────────────────────┘
```

**Sub-sections within Intelligence Brief:**

**Incumbent Analysis:**
- Incumbent Signal Score (0–10): How "wired" does this RFP feel?
- Specific signals detected (see LLM layer section below)
- Named incumbent if identifiable from FPDS prior awards
- Incumbent's known weaknesses/gaps the LLM infers from the RFP language

**Competitive Landscape:**
- Likely bidders based on FPDS history + set-aside type
- Your company's position vs. likely competition
- Set-aside analysis (is this 8(a)? SDVOSB? Does the agency actually follow through?)

**Price Intelligence:**
- Estimated award range from FPDS comparable awards
- LPTA vs. Best Value detection
- Whether price will be a primary differentiator

**Strategic Recommendation (natural language):**
> "This solicitation shows moderate competitive conditions. The technical evaluation weight favors firms with direct Army IT modernization experience. Price will matter but not dominate. The 8-day response window is aggressive but manageable if you have reusable past performance writeups. We recommend bidding. Lead with your CMMC Level 2 certification and Army-specific references."

---

#### TAB 2: Compliance Matrix (Existing — Enhanced)

**What's there:** The current tab is functional. Enhance it:
- Auto-populate from SAM.gov URL (not just pasted text)
- Show: Requirements, Section reference, FAR/DFARS cite, Status, Risk, Action needed
- Highlight hidden requirements (found in PWS, not Section L)
- One-click "Generate Draft" per requirement row
- Export to Excel

**New: Requirement Source Tags**
- Every row tagged: [Section L] [Section M] [PWS] [Attachment] [CLIN]
- Contractors often miss PWS requirements. We surface them.

---

#### TAB 3: Proposal Workspace

**What's there:** Basic Executive Summary drafter. Replace with:

**Proposal Roadmap:**
```
Section          Recommended Pages  Status     AI Assist
────────────────────────────────────────────────────────
Technical Approach     8–12 pages   ○ Not started  [Draft]
Management Approach    4–6 pages    ○ Not started  [Draft]
Past Performance       3–5 pages    ○ Not started  [Draft]
Price/Cost Volume      5–8 pages    ○ Not started  [Draft]
Executive Summary      1–2 pages    ○ Not started  [Draft]
```

**Each section has:**
- LLM-generated starter draft based on requirements + your company profile
- "Focus areas" — what the agency cares about most for this section, inferred from RFP language
- Red flags — compliance gaps to address in this section

---

#### TAB 4: Agency Intelligence

**Agency profile built from FPDS + USASpending + RFP language:**

```
ARMY CORPS OF ENGINEERS — WALLA WALLA DISTRICT
───────────────────────────────────────────────
Awards in last 24 months:    47 contracts
Avg award vs. ceiling:       83% of ceiling
Incumbent retention rate:    71%
Protest rate:                4% (LOW)
Primary set-aside types:     SB (48%), Full (32%), 8(a) (20%)
Avg evaluation time:         62 days

Recent Awards (similar NAICS):
• $8.2M — [Company] — IT Infrastructure Support
• $6.7M — [Company] — Network Operations
• $11.4M — [Company] — Cloud Migration Services

Agency Patterns (LLM inferred):
• Prefers detailed management plans with named key personnel
• Past performance evaluated strictly — must be within 5 years
• Price consistency matters — unusual escalations flagged in past protests
```

---

#### TAB 5: Export / Report

One-click export of the full Intelligence Report (PDF) — see Report Plan below.

---

### Section 4: Discovery View

**Opportunity Feed — personalized, not raw SAM.gov**

**Input (one-time setup):**
- Target NAICS codes
- Target agencies
- Dollar range
- Set-aside type(s)
- Geographic constraints

**Output:**
- Ranked list of opportunities with BidSmith Score
- Each card shows: Title, Agency, Value, Set-aside, Deadline, BidSmith Score, "Why it's a match"
- One-click → full Intelligence Analysis

**BidSmith Score (0–100):**
Composite of:
- NAICS match strength
- Agency familiarity (do you have past performance here?)
- Win probability estimate
- Competition level
- Incumbent risk

**Pre-solicitation alerts:**
- Sources Sought + RFIs that match profile
- "This is 90 days before the RFP — consider responding to the Sources Sought"

---

### Section 5: Analytics View (Month 2+)

**Win Rate Dashboard:**
- Win rate over time (monthly)
- Win rate by agency
- Win rate by contract type (IDIQ, FFP, T&M)
- Win rate by set-aside type

**Proposal Efficiency:**
- Avg hours per proposal (manual entry or integration)
- Cost per win estimate
- No-bid rate (% of opportunities evaluated and passed)

**Pipeline Value Forecast:**
- If win rates hold, expected revenue over next 12 months
- Best case / base case / conservative scenarios

---

## 2. THE LLM INTELLIGENCE LAYER — "READ BETWEEN THE LINES"

This is the moat. This is what no spreadsheet, no GovWin, no Deltek does.

### Incumbent Signal Detection (10 Specific Signals)

The LLM reads the full solicitation and scores each signal 0–3. Total score = Incumbent Risk (0–30 → normalized to 0–10).

**Signal 1: Experience Specificity**
What to look for: Very narrow, specific experience requirements that only one company could plausibly have.
Example: "Offeror must demonstrate 4+ years operating the AFMS Electronic Health Record at a DoD Level 1 trauma center."
Signal: This is probably the incumbent's exact job description. Score: HIGH.

**Signal 2: Transition Minimization Language**
What to look for: Phrases emphasizing minimal disruption, seamless transition, no operational downtime.
Example: "Contractor must demonstrate ability to maintain operations without degradation during transition period."
Signal: Incumbents transition to themselves. Challengers can't guarantee this. Score: HIGH.

**Signal 3: Knowledge of Existing Infrastructure**
What to look for: Requirements to demonstrate familiarity with current systems, tools, processes.
Example: "Must have working knowledge of the agency's existing ServiceNow configuration and custom CMDB structure."
Signal: Only the incumbent has this knowledge without a discovery period. Score: HIGH.

**Signal 4: Short Response Window for Complex Work**
What to look for: RFPs with <10 business days response window for solicitations requiring complex technical approaches.
Signal: Incumbents can pull from existing work. New bidders can't produce a quality response. Score: MEDIUM-HIGH.

**Signal 5: Past Performance Value Threshold**
What to look for: Required past performance dollar thresholds that are suspiciously specific.
Example: "Offeror must demonstrate 3 references with contracts valued at $7.5M+."
Signal: If this value is unusually high for the NAICS/size, it filters to the incumbent. Score: MEDIUM.

**Signal 6: Clearance + Location Specificity**
What to look for: Specific clearance levels + specific location combinations.
Example: "Key personnel must hold active TS/SCI with CI polygraph and be on-site in [very specific location] Day 1."
Signal: Existing cleared, on-site personnel = incumbent advantage. Score: HIGH.

**Signal 7: Incumbent Reference in SOW Language**
What to look for: Deliverable names, tool names, or acronyms that match known incumbents or their internal naming.
Signal: Agency copied the SOW from the current contractor's performance plan. Score: HIGH.

**Signal 8: Evaluation Weight Imbalance**
What to look for: Price-only or LPTA evaluation for complex technical work.
Example: Technically Acceptable / Lowest Price on a 5-year IT modernization.
Signal: If the work is complex but only price differentiates, the agency already decided. Score: MEDIUM.

**Signal 9: Subcontracting Plan Language**
What to look for: Required small business subcontracting plans that mirror the current contractor's partnership structure.
Signal: Specific percentages + named sub categories that match incumbent's known team. Score: MEDIUM.

**Signal 10: Timeline Gaps**
What to look for: Solicitation issued with very short period of performance start dates.
Example: Award announced April 15, performance starts May 1 with no mobilization period.
Signal: Only the incumbent can mobilize in 2 weeks. Score: MEDIUM-HIGH.

---

### Evaluation Intelligence

**What LLM Infers (even when not explicitly stated):**

**Evaluation Type Detection:**
- Scans Section M language patterns
- "Best value to the government" + technical subfactors = Best Value
- "Technically acceptable" + "lowest price" = LPTA
- "Tradeoff" language = Best Value with price-technical tradeoff
- Outputs: [LPTA] [Best Value – Technical-Led] [Best Value – Price-Led] [Tradeoff]

**Technical Weight Inference:**
- Counts pages/language density devoted to technical requirements vs. price requirements
- Analyzes evaluation factor language for qualitative vs. quantitative emphasis
- Outputs: Inferred technical weight % and price weight %

**What Matters Most (Discriminator Inference):**
- Identifies which evaluation subfactors have the most language/detail
- These are the ones the agency cares about most, even if all factors are "equally weighted"
- Output: "Agency appears to weight [past performance] most heavily based on language density"

---

### Hidden Requirement Mining

**Where LLM looks beyond Section L/M:**

**PWS/SOW Analysis:**
- Tasks listed in PWS that imply capabilities not explicitly stated in Section L
- CDRLs (Contract Data Requirements) that imply tools, certifications, formats
- Quality standards referenced in PWS that require specific certifications

**Exhibits and Attachments:**
- Security requirements in classified attachments
- Transition plans that imply knowledge transfer obligations
- GFE lists that imply operational responsibilities

**Output: Hidden Requirements Table**
Additional requirements found outside Section L that must be addressed:
| Hidden Requirement | Found In | Implication | Risk if Missed |
|--------------------|----------|-------------|----------------|
| ITAR compliance | Exhibit A | Must disclose ITAR-registered facilities | DISQUALIFICATION |
| CMMC Level 2 | PWS §3.4 | Not in Section L but evaluators will check | HIGH |

---

### Agency Pattern Intelligence

**Built from FPDS + USASpending historical data:**

What LLM extracts and presents:
1. Does this agency typically keep incumbents?
2. What % of awards go to small business (vs. stated set-aside goals)?
3. Average price-to-ceiling ratio on past awards (helps price strategy)
4. Time from close to award (helps BD planning)
5. Protest history (high protest = scrutinized evaluation process)
6. Key personnel requirements frequency (helps staffing strategy)
7. Typical proposal length preference (inferred from Section L page limits)

---

## 3. THE REPORT — What the Client Sees

This is what a contractor exports and brings to their CEO or BD leadership.

### Report Format: "BidSmith Intelligence Brief"
**Length:** 5–7 pages  
**Output:** PDF, Word, or shareable link  
**Brand:** Clean, institutional — looks like something worth $500 on its own

---

### PAGE 1: Opportunity Summary + Recommendation

```
┌─────────────────────────────────────────────────────────────────┐
│  ■ BIDSMITH INTELLIGENCE BRIEF                                  │
│  Prepared for: [Company Name] · [Date]                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SOLICITATION                                                    │
│  Army Corps of Engineers — IT Infrastructure Support Services    │
│  W912EE-26-R-0042  ·  NAICS 541512  ·  $12.4M ceiling          │
│  Due: April 14, 2026  ·  Response window: 11 business days      │
│                                                                  │
│  WIN PROBABILITY                       RECOMMENDATION            │
│  ██████████████░░░░  73%              ✓ BID                     │
│  MODERATE-HIGH CONFIDENCE                                        │
│                                                                  │
│  BASIS FOR RECOMMENDATION                                        │
│  Technical requirements match your demonstrated capabilities.    │
│  Incumbent signal is low. Evaluation rewards past performance    │
│  with Army clients — which you have. Price range is within       │
│  your cost structure based on 4 comparable FPDS awards.          │
│                                                                  │
│  TOP 3 RISKS                                                     │
│  1. SPRS score required — confirm current posting              │
│  2. Key personnel clearances must be active Day 1              │
│  3. Response window is tight — reserve team bandwidth now       │
│                                                                  │
│  KEY DISCRIMINATORS TO LEAD WITH                                 │
│  1. CMMC Level 2 certification (competitors likely uncertified) │
│  2. Army IT past performance — 3 relevant references available  │
│  3. On-site personnel already cleared at required level         │
└─────────────────────────────────────────────────────────────────┘
```

---

### PAGE 2: Incumbent & Competitive Intelligence

**Incumbent Signal Analysis:**
- Score: 4/10 [LOW RISK]
- Table of signals checked with findings per signal
- "No incumbent-specific language detected" OR "3 incumbent signals found — review before proceeding"

**Competitive Landscape:**
- Named likely competitors (based on FPDS history at this agency with similar NAICS)
- Your position vs. each competitor (strength/gap table)
- Set-aside analysis

---

### PAGE 3: Compliance Matrix

The full table — clean, professional, ready to hand to the proposal manager.

| ID | Requirement | Section | FAR Reference | Status | Risk | Action Required |
|----|-------------|---------|---------------|--------|------|-----------------|
| REQ-01 | SAM.gov registration active | L.1 | FAR 52.204-7 | ✅ Compliant | LOW | Confirm before submission |
| REQ-02 | CMMC Level 2 | M.3 | DFARS 252.204-7021 | ⚠ Conditional | HIGH | Document certification |

Hidden requirements flagged separately (found in PWS/Attachments, not Section L).

---

### PAGE 4: Evaluation Intelligence

**How the agency will score:**
- Evaluation type: Best Value — Technical-Led
- Inferred weight: Technical 60% / Past Performance 25% / Price 15%
- "Technical approach language occupies 12 pages vs. 2 pages for price — this agency values solution over cost"

**Price Competitiveness:**
- Comparable award data from FPDS (anonymized)
- Recommended price range
- LPTA risk assessment

**What to Emphasize (by evaluation factor):**
- Technical: Cloud migration methodology, CMMC pathway documentation
- Past Performance: Army-specific references, on-time delivery record
- Price: Show cost realism + be within 10% of ceiling

---

### PAGE 5: Proposal Roadmap

**Section-by-section writing guide based on this specific RFP:**

| Section | Focus Areas (from RFP) | Recommended Pages | Discriminator to Feature |
|---------|----------------------|-------------------|--------------------------|
| Technical Approach | Cloud migration, zero-downtime cutover, CMMC documentation | 10–12 | Your CMMC Level 2 cert |
| Management | Key personnel named, org chart, quals | 4–5 | Named PMs with clearances |
| Past Performance | Army IT references, contract values, POC contact | 3–4 | 3 direct Army references |
| Executive Summary | Agency mission alignment, win theme | 1–2 | Lead with Army experience |

**Win Theme (LLM-generated):**
> "Proven Army IT partner with active clearances, CMMC Level 2 certification, and zero-disruption transition capability — delivering operational continuity from Day 1."

---

### PAGE 6: Agency Intelligence Summary

- Agency name, district, contracting office
- Past 24 months award history (summary)
- Incumbent retention rate, avg price-to-ceiling, protest rate
- Evaluator preferences inferred from past awards
- Recommended outreach history (did you respond to any prior Sources Sought at this agency?)

---

## 4. WHAT WE BUILD NEXT (Priority Order)

### Phase 1 — Enhance What Exists (Weeks 1–2)
These are quick wins on the current GovConDashboard:

1. **Add Incumbent Signal panel to dashboard** — surface the 10-signal analysis on any pasted solicitation text. This is the single highest-value LLM output we can ship fast.

2. **Replace ExecutiveSummary with Win Probability + Recommendation card** — the current drafter is weak. Replace with the Intelligence Brief layout from Page 1 of the report.

3. **Add PDF export to the report** — the full 5-page report exportable as a PDF. This is a lead gen tool in itself.

4. **Add solicitation pipeline sidebar** — even a simple list of URLs the user has analyzed, with deadline and win probability. Persistence via Supabase.

### Phase 2 — Discovery + Agency Intel (Weeks 3–6)

5. **SAM.gov opportunity feed** — personalized feed with BidSmith Score. Build on top of the existing SAM scraper.

6. **FPDS agency intelligence pull** — automated agency profile builder from USASpending API.

7. **Hidden requirement mining** — second LLM pass on PWS/attachments, not just Section L/M.

### Phase 3 — Full Platform (Month 2+)

8. **Company profile builder** — contractor inputs: NAICS, past performance, certifications, clearances. Every analysis personalizes to them.

9. **Win/Loss analytics** — post-award tracking via FPDS. Automatically flag when a bid they tracked awards to someone else.

10. **Proposal collaboration** — multi-user access so the capture manager + proposal writer both work in BidSmith.

---

## 5. THE STICKY FACTOR — WHY THEY'LL NEVER LEAVE

The product becomes a system of record. Every solicitation they analyze lives in BidSmith. Their pipeline, their analysis history, their win/loss record — all in one place. After 90 days of use, switching to anything else means losing institutional memory.

The report is also a trojan horse: contractors share it with their BD team, CEO, partners. Every shared report is a demo. Every demo is a potential signup.

---

## 6. MONETIZATION LOGIC

| Tier | Price | Limits | Who It's For |
|------|-------|--------|--------------|
| Free | $0 | 3 audits/month | Solo BD leads, trial |
| Pro | $99/mo | Unlimited audits, no PDF export | Small firms, 1 user |
| Team | $299/mo | Unlimited + PDF export + pipeline tracking | 2–5 user teams |
| Enterprise | Custom | Full platform + agency intel + FPDS integration | 10+ person BD teams |

**Upsell trigger:** User hits 3 audit limit → "You've analyzed 3 solicitations this month. Upgrade to Pro for unlimited audits and the full Intelligence Report PDF."

---

## 7. ONE-LINE VERSION OF THIS PLAN

> BidSmith answers the question every government contractor asks before every RFP: "Do we actually have a shot at this?" — in 90 seconds, with the receipts.
