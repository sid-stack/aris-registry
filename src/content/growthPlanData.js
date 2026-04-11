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
