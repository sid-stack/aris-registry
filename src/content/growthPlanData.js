export const INTENT_CLUSTERS = [
  {
    id: "qualification",
    label: "RFP Qualification and Bid/No-Bid",
    audience: "GovCon capture leads and BD directors",
    topics: [
      "how to qualify a government rfp",
      "bid no bid framework for government contracts",
      "federal rfp go no-go checklist",
      "how to avoid unwinnable federal bids",
      "govcon pwin scoring model",
    ],
  },
  {
    id: "compliance",
    label: "Compliance Matrix and FAR/DFARS Risk",
    audience: "Proposal managers and compliance analysts",
    topics: [
      "rfp compliance matrix template",
      "far dfars clause checklist",
      "section l and section m checklist",
      "how to build a federal compliance matrix",
      "common federal proposal compliance mistakes",
    ],
  },
  {
    id: "workflow",
    label: "Proposal Workflow and Timeline",
    audience: "Proposal operations teams",
    topics: [
      "federal proposal timeline template",
      "capture plan template for govcon",
      "proposal handoff process bd to proposal team",
      "how to run rfp shred sessions",
      "government proposal production workflow",
    ],
  },
  {
    id: "marketIntelligence",
    label: "Agency and Opportunity Intelligence",
    audience: "Founders and growth-stage GovCon teams",
    topics: [
      "how to find federal opportunities by naics",
      "sam gov search strategy for small business",
      "how to evaluate incumbent contracts",
      "govcon agency targeting framework",
      "federal opportunity pipeline scorecard",
    ],
  },
];

export const BOFU_RESOURCES = [
  {
    slug: "how-to-qualify-government-rfp",
    title: "How to Qualify a Government RFP in 15 Minutes",
    description: "A fast qualification workflow for GovCon teams to decide bid/no-bid before expensive proposal work starts.",
    cta: "Run a free qualification audit in BidSmith",
    sections: [
      "Start with hard disqualifiers: set-aside eligibility, required certifications, and NAICS fit.",
      "Score strategic fit: agency past performance, contract size, and timeline realism.",
      "Run a pWin sanity check and stop any deal below your threshold unless there is a strategic reason.",
    ],
  },
  {
    slug: "federal-bid-no-bid-framework",
    title: "Federal Bid/No-Bid Framework for Capture Teams",
    description: "Use this repeatable scoring model to make consistent go/no-go decisions across your pipeline.",
    cta: "Use the bid/no-bid scorecard template",
    sections: [
      "Weight criteria by impact: eligibility, technical fit, past performance, and competitive position.",
      "Enforce a minimum threshold before assigning proposal resources.",
      "Record decision rationale so teams can review outcomes and improve win-rate over time.",
    ],
  },
  {
    slug: "rfp-compliance-matrix-checklist",
    title: "RFP Compliance Matrix Checklist (FAR/DFARS)",
    description: "A practical checklist to extract requirements from Sections C, L, M, H, and I without missing disqualifiers.",
    cta: "Generate a compliance matrix in 90 seconds",
    sections: [
      "Capture every shall/must statement with source citations.",
      "Map each requirement to owner, due date, and proposal section.",
      "Flag high-risk clauses early to avoid late-stage rework.",
    ],
  },
  {
    slug: "section-l-m-review-process",
    title: "Section L and Section M Review Process",
    description: "A tactical process to align proposal execution with evaluator scoring criteria.",
    cta: "See a sample matrix and evaluation map",
    sections: [
      "Convert Section L instructions into a submission QA checklist.",
      "Translate Section M scoring factors into proposal win themes.",
      "Use a final compliance gate 48 hours before submission.",
    ],
  },
  {
    slug: "federal-proposal-timeline-template",
    title: "Federal Proposal Timeline Template (30/60/90)",
    description: "Plan proposal milestones with clear owners from qualification through final submission.",
    cta: "Copy the timeline template",
    sections: [
      "Define milestones for kickoff, shred, pink team, red team, and gold team.",
      "Assign owners and dependencies to each timeline stage.",
      "Track at-risk tasks daily during the final 10 days.",
    ],
  },
  {
    slug: "capture-plan-template-govcon",
    title: "Capture Plan Template for GovCon Teams",
    description: "A compact capture plan structure for opportunity strategy, teaming, pricing, and risk.",
    cta: "Use the capture plan template",
    sections: [
      "Document customer problem, buying center, and incumbent position.",
      "Define win themes, teaming strategy, and differentiated proof points.",
      "Run weekly capture reviews until solicitation release.",
    ],
  },
  {
    slug: "govcon-partner-outreach-playbook",
    title: "GovCon Partner Outreach Playbook (10-Partner Sprint)",
    description: "A practical process to source warm traffic through consultants, trainers, and GovCon service partners.",
    cta: "Copy the partner outreach sequence",
    sections: [
      "Prioritize partners already trusted by your ICP audience.",
      "Pitch one co-branded asset and one webinar concept per partner.",
      "Track partner touches and outcomes in a weekly pipeline review.",
    ],
  },
  {
    slug: "qualified-traffic-kpi-dashboard",
    title: "Qualified Traffic KPI Dashboard for GovCon SaaS",
    description: "Track qualified sessions, conversion rates, and channel performance with a weekly operating cadence.",
    cta: "Review KPI tracking definitions",
    sections: [
      "Use high-intent page views as top-of-funnel qualification signal.",
      "Track demo-book rate by source channel and landing page.",
      "Apply three-week kill rules to channels without traction.",
    ],
  },
];

/**
 * Executable conversion funnels — stages, signals, and what to count weekly.
 * Aligns outbound, inbound, partners, and warm intros to one north star: booked conversation → paid step.
 */
export const SALES_FUNNELS = [
  {
    id: "outbound-cold",
    name: "Outbound (signal-based cold email)",
    objective: "Book qualified calls with ICP accounts showing RFP/capture intent.",
    primaryMotion: "Apollo/Clay list → 1 signal per email → light CTA → follow-up with value.",
    stages: [
      {
        step: 1,
        label: "List & signal",
        action: "Build a small weekly list (20–40) with one verified trigger per row (hiring, SAM language, RFP volume).",
        successSignal: "Every send has a specific first line tied to that trigger.",
        countThis: "Adds to list / emails sent",
      },
      {
        step: 2,
        label: "Deliver & follow up",
        action: "Day 0 send; Day 3 short follow-up referencing the same signal; stop after 2 touches if no engagement.",
        successSignal: "Replies that ask a question or agree to a time.",
        countThis: "Replies; positive replies",
      },
      {
        step: 3,
        label: "Book",
        action: "Offer 20-min fit call or async Loom + calendar link; default to paid audit if they want deliverable first.",
        successSignal: "Calendar hold or explicit yes to next step.",
        countThis: "Meetings booked",
      },
      {
        step: 4,
        label: "Paid wedge",
        action: "Close $50 intro audit or equivalent time-boxed deliverable; scope full plan only after they’ve seen output.",
        successSignal: "Payment or PO verbal + email confirmation.",
        countThis: "Paid audits / pilots started",
      },
    ],
    killRule: "If reply rate < ~2% after 200 sends with refreshed signals, rewrite hook or tighten ICP before scaling volume.",
  },
  {
    id: "inbound-bofu",
    name: "Inbound (BOFU content → product)",
    objective: "Turn high-intent page views into signups and audit starts.",
    primaryMotion: "Intent clusters + resource pages → single CTA (audit / try matrix) → in-app activation.",
    stages: [
      {
        step: 1,
        label: "Qualified session",
        action: "Traffic lands on /resources/*, matrix generator, or guide pages from search, social, or partner links.",
        successSignal: "Session duration or scroll past hero (proxy for read).",
        countThis: "Qualified sessions / week (by landing URL)",
      },
      {
        step: 2,
        label: "CTA click",
        action: "One primary CTA per page; avoid competing buttons.",
        successSignal: "Click on audit, signup, or start flow.",
        countThis: "CTA clicks; CTR by page",
      },
      {
        step: 3,
        label: "Account / start",
        action: "Friction-low signup; push user to first SAM paste or upload in same session.",
        successSignal: "First audit or matrix job started within 24h.",
        countThis: "Signups; audit_started (or equivalent) within 24h",
      },
      {
        step: 4,
        label: "Revenue path",
        action: "In-app or email nudge to paid tier or audit bundle after they see output.",
        successSignal: "Checkout initiated or sales reply from product-led user.",
        countThis: "checkout_initiated; outbound replies from inbound users",
      },
    ],
    killRule: "If a BOFU page gets traffic but CTA CTR is dead vs sibling pages, rewrite above-fold promise or CTA in one sprint.",
  },
  {
    id: "partner-referral",
    name: "Partner & referral",
    objective: "Borrow trust from audiences that already serve GovCon proposal teams.",
    primaryMotion: "Consultants, trainers, PTAC-style orgs → co-branded asset or webinar → their list → your CTA.",
    stages: [
      {
        step: 1,
        label: "Target & pitch",
        action: "Pick partners whose buyers match ICP; pitch one concrete co-deliverable (checklist + live teardown).",
        successSignal: "Verbal yes to a date or asset swap.",
        countThis: "Partner conversations; verbal commits",
      },
      {
        step: 2,
        label: "Co-create & distribute",
        action: "Run webinar or ship co-branded PDF; partner emails their list; you post recap.",
        successSignal: "Registrations or downloads attributable to partner UTM.",
        countThis: "Registrations / downloads by partner",
      },
      {
        step: 3,
        label: "Convert",
        action: "Same CTA as inbound: audit or free structured pass; fast personal follow-up to registrants.",
        successSignal: "Booked calls or audit starts from partner-sourced leads.",
        countThis: "Meetings and audits from partner channel",
      },
      {
        step: 4,
        label: "Repeat",
        action: "Document what worked; ask for quarterly repeat or introduction to second partner.",
        successSignal: "Second event or intro to adjacent community.",
        countThis: "Repeat partner activations",
      },
    ],
    killRule: "If two partners in the same category ghost after one touch, change offer from ‘partnership’ to ‘one email to your list + your checklist’.",
  },
  {
    id: "warm-network",
    name: "Warm network & intros",
    objective: "First client often comes from people who already trust you — fastest path to referenceable win.",
    primaryMotion: "Short asks to ex-colleagues, advisors, investors, friendly primes: one intro to a capture/BD leader.",
    stages: [
      {
        step: 1,
        label: "Map",
        action: "List 30 people who can intro to GovCon operators; note company and likely role they can reach.",
        successSignal: "Written list with next action date per name.",
        countThis: "Names on map",
      },
      {
        step: 2,
        label: "Ask",
        action: "Blunt 3-line ask: who runs bids, one sentence on BidSmith wedge, optional forwardable blurb.",
        successSignal: "Intro email or LinkedIn connection accepted with context.",
        countThis: "Asks sent; intros received",
      },
      {
        step: 3,
        label: "Serve",
        action: "Treat intro calls as consulting: diagnose their pipeline pain; offer audit or pilot with clear scope.",
        successSignal: "They volunteer a live opportunity to run through the product.",
        countThis: "Live opps run in product",
      },
      {
        step: 4,
        label: "Close & harvest",
        action: "Invoice small wedge; ask for testimonial (anonymous attribution ok) and one more intro.",
        successSignal: "Paid + agreed quote or case permission.",
        countThis: "Closed-won; intros asked",
      },
    ],
    killRule: "If intros stall, narrow ask: ‘Who runs proposal ops at your last prime?’ beats ‘anyone in GovCon’.",
  },
];

/**
 * High-level “execution funnel” — three parallel pipes (not a strategy deck).
 * Dollar amounts for SaaS track match defaults in api/services/stripe.js unless env overrides.
 */
export const EXECUTION_ARCHITECTURE_THREE_TRACK = [
  {
    id: "whale",
    name: "Whale track (high ticket, manual)",
    source: "LinkedIn and warm intros: BD/capture at services primes, legal/GC-adjacent buyers who feel solicitation drag.",
    hook: "Lead with a concrete wedge: structured first-pass shred vs. burning a full day on the solicitation before go/no-go.",
    conversion: "15-minute fit Zoom → scoped pilot (minimum you set; invoice via Stripe or contract).",
    opsRule: "Low volume, high preparation: one tailored thread per day beats 50 generic blasts.",
  },
  {
    id: "engine",
    name: "Engine track (mid-ticket, low touch)",
    source: "Cold email at scale (e.g. Instantly) to ICP GovCon lists with one verified signal per row.",
    hook: "Risk/compliance visibility angle; CTA to landing with one primary action.",
    conversion:
      "Landing page → Stripe checkout → audit deliverable (one-time audit defaults to $99 in api/services/stripe.js; override with STRIPE_AUDIT_PRICE_CENTS).",
    opsRule: "Ship the sequence before you tune copy again; measure sends → clicks → checkouts weekly.",
  },
  {
    id: "leverage",
    name: "Leverage track (partner / affiliate)",
    source: "Proposal consultants, GovCon SEO/content shops, trainers, communities that already own trust with your ICP.",
    hook: "They endorse a tool that produces defensible compliance artifacts for their clients.",
    conversion: "Referral or affiliate link → Pro subscription ($299/mo list price in product; adjust rev-share in your partner agreement).",
    opsRule: "One clear offer + tracking link; pay for distribution only when it converts.",
  },
];

export const TEMPLATE_ASSETS = [
  {
    id: "bid-no-bid-scorecard",
    label: "Bid/No-Bid Scorecard",
    body: `Bid/No-Bid Scorecard

Opportunity:
Agency:
Due Date:

1) Eligibility (0-25):
- Set-aside fit
- Required certifications
- NAICS alignment

2) Capability Match (0-25):
- Technical fit
- Relevant past performance
- Delivery readiness

3) Competitive Position (0-25):
- Incumbent strength
- Pricing position
- Teaming advantage

4) Strategic Value (0-25):
- Revenue impact
- Account priority
- Follow-on potential

Total Score:
Decision Threshold:
Final Decision:
Decision Rationale:
`,
  },
  {
    id: "partner-webinar-brief",
    label: "Partner Webinar Brief",
    body: `Partner Webinar Brief

Partner:
Audience:
Date:

Working Title:
Primary Promise:

Agenda (30 min):
1) Top 5 GovCon compliance mistakes
2) Live RFP qualification teardown
3) Bid/No-bid scoring walkthrough
4) Q&A + free audit offer

Distribution Plan:
- Partner sends to list
- Founder posts on LinkedIn
- Repurpose recording into 3 BOFU assets

CTA:
- Free RFP audit
- Download scorecard
`,
  },
];
