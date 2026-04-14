/**
 * /govcon-guide — The complete federal contracting process explained.
 * Long-form SEO content + trust builder. Targets:
 * "how to get government contracts", "federal contracting process", "how SAM.gov works"
 */
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { track } from "../utils/analytics";

const PHASES = [
  {
    number: "01",
    label: "Registration & Eligibility",
    headline: "Before you can bid, you have to exist in the federal system",
    time: "2–4 weeks",
    pain: "One-time setup, but errors here disqualify you from every bid",
    color: "#6366f1",
    steps: [
      {
        title: "Get a DUNS / UEI number",
        body: "Every entity doing business with the federal government needs a Unique Entity Identifier (UEI). This replaced DUNS numbers in April 2022. Register free at SAM.gov — it takes 10 business days to activate.",
      },
      {
        title: "Register in SAM.gov",
        body: "System for Award Management (SAM.gov) is the federal vendor database. Your registration must be active and renewed annually. An inactive SAM registration is an automatic disqualifier on any federal bid. You'll choose your NAICS codes here — pick carefully, as these determine which solicitations you're eligible for.",
      },
      {
        title: "Obtain small business certifications (if applicable)",
        body: "If you qualify, certifications like 8(a) Business Development, HUBZone, SDVOSB, or WOSB unlock set-aside contracts where competition is restricted to your category. These can be worth millions — an 8(a) firm can receive sole-source awards up to $4M (non-manufacturing) or $25M (DoD). Apply through SBA.gov.",
      },
      {
        title: "Set up your Capability Statement",
        body: "A one-page PDF document that summarizes your core competencies, differentiators, past performance, and NAICS codes. This is your business card in federal contracting — agencies and prime contractors request it constantly.",
      },
    ],
    bsNote: null,
  },
  {
    number: "02",
    label: "Opportunity Discovery",
    headline: "Finding the right bids in a sea of noise",
    time: "Ongoing daily activity",
    pain: "Thousands of new solicitations posted weekly — most are irrelevant or won't be won by new entrants",
    color: "#0ea5e9",
    steps: [
      {
        title: "SAM.gov Opportunities search",
        body: "The primary source for federal solicitations. Filter by NAICS code, agency, set-aside type, contract value, and location. New opportunities are posted daily. The UI is functional but slow — most capture managers spend 30–60 minutes here every morning.",
      },
      {
        title: "Understand opportunity types",
        body: "Sources Sought / RFI (Request for Information) — market research, no bid required but respond to get on their radar. Pre-Solicitation — agency is planning, proposal not due yet. RFP / Solicitation — the real bid, usually 30–60 days to respond. IDIQ / GWAC — vehicles like OASIS+, SEWP, or STARS III that allow future task orders.",
      },
      {
        title: "Monitor USAspending.gov for incumbent intelligence",
        body: "Before bidding on any recompete, check USAspending.gov to see who currently holds the contract, how much they're getting paid, and for how long. An incumbent with 5 years of performance and satisfied customers is hard to displace — factor this into your bid/no-bid decision.",
      },
      {
        title: "Build an agency pipeline",
        body: "Agencies re-award similar contracts repeatedly. Map the agencies where your capabilities fit and monitor their upcoming procurement forecasts (most publish these annually). Relationship-building through capabilities briefings and Sources Sought responses before a solicitation drops is the fastest path to winning.",
      },
    ],
    bidsmithNote: "BidSmith Search surfaces active solicitations and past award history across all federal agencies from a single query — no more manual SAM.gov filtering.",
  },
  {
    number: "03",
    label: "Initial Screening (Go / No-Go)",
    headline: "The most critical — and most skipped — step",
    time: "30 min – 2 hours per opportunity",
    pain: "Teams commit to bids they can't win. This is where $10k–$100k of proposal effort gets wasted.",
    color: "#f59e0b",
    highlight: true,
    steps: [
      {
        title: "Check hard eligibility requirements first",
        body: "Before reading a single page of the RFP, check: (1) Set-aside type — are you eligible? (2) NAICS code — does it match your registration? (3) Required certifications — CMMC, clearance, bonding. These are binary disqualifiers. If you fail any, stop here and move to the next opportunity.",
      },
      {
        title: "Assess competitive position",
        body: "Is there an incumbent? How long have they been on the contract? Are they a large or small business? A well-entrenched incumbent with satisfied customers and mobilized workforce is hard to beat on a recompete. New work or 'competitive' language in the solicitation is more winnable.",
      },
      {
        title: "Evaluate fit vs. capability",
        body: "Do you have the past performance? Most solicitations require 3 relevant contracts of similar size, scope, and complexity within the last 5 years. If you're missing past performance, you either need a teaming partner who has it, or this opportunity isn't right for you yet.",
      },
      {
        title: "Calculate the cost of bidding",
        body: "A simple RFP response can cost $5,000–$20,000 in staff time. A complex technical proposal for a $50M+ contract can run $50,000–$150,000. Your probability of win (pWin) needs to justify that investment. Industry standard: bid when pWin > 30%.",
      },
    ],
    bsNote: "This is exactly where BidSmith lives. Paste a SAM.gov URL → BidSmith checks every eligibility requirement, flags disqualifiers with verbatim evidence from the RFP, and delivers a bid/no-bid recommendation. In 90 seconds instead of 2 hours.",
  },
  {
    number: "04",
    label: "Deep Compliance Review",
    headline: "Parsing the requirements no one wants to read",
    time: "1–3 days per bid",
    pain: "Hidden requirements buried in Section L and Section M that disqualify submissions at evaluation",
    color: "#ef4444",
    steps: [
      {
        title: "Section L — Instructions to Offerors",
        body: "This is the 'how to bid' section. It dictates: page limits, font size, volume structure, submission format, oral presentation requirements, and deadline. Failure to follow Section L instructions exactly is grounds for immediate rejection — and contracting officers do reject non-conforming proposals.",
      },
      {
        title: "Section M — Evaluation Criteria",
        body: "This is the 'how you'll be scored' section. Factors are listed in order of importance — usually Technical Approach, Past Performance, and Price. Understand which factors are worth the most and allocate your proposal effort accordingly. An 'Outstanding' on the highest-weighted factor can outweigh a 'Good' on everything else.",
      },
      {
        title: "Section C — Statement of Work / PWS",
        body: "The actual scope of work. Every task, deliverable, and performance standard lives here. Your technical approach must respond to every PWS paragraph — evaluators check this. Build a compliance matrix that maps each PWS requirement to a specific section of your proposal.",
      },
      {
        title: "Section H — Special Contract Requirements",
        body: "Where agencies hide agency-specific requirements that don't fit standard FAR clauses: transition periods, incumbent hiring obligations, security badging procedures, subcontracting limitations. Read this section carefully — surprises here have killed otherwise strong proposals.",
      },
      {
        title: "FAR and DFARS clauses (Section I)",
        body: "Section I lists the regulatory clauses that govern contract performance. Key ones to audit: FAR 52.204-21 (cybersecurity), FAR 52.219-x (small business), DFARS 252.204-7012 (CMMC/NIST 800-171), DFARS 252.204-7021 (CMMC Level certification). Violations of these clauses during performance can result in contract termination or debarment.",
      },
    ],
    bsNote: "BidSmith extracts every FAR/DFARS clause, maps them to the 7-pillar compliance grid, and flags gaps with the exact source text. What takes a compliance analyst 2 days, BidSmith delivers in 90 seconds.",
  },
  {
    number: "05",
    label: "Proposal Development",
    headline: "Turning your capabilities into a winning document",
    time: "2–8 weeks depending on complexity",
    pain: "Expensive, all-consuming, and most proposals lose",
    color: "#8b5cf6",
    steps: [
      {
        title: "Build the compliance matrix",
        body: "Before writing a word, create a matrix that maps every Section L requirement, every Section M evaluation factor, and every PWS task to a specific place in your proposal. This is your proposal skeleton. Writers use it to ensure nothing is missed. Evaluators use something similar to score your response.",
      },
      {
        title: "Develop win themes",
        body: "Win themes are the 3–5 core reasons why your team should win this contract. They must be grounded in the evaluation criteria (Section M), differentiated from the likely competition, and reinforced throughout every volume of your proposal — not just the executive summary.",
      },
      {
        title: "Technical volume",
        body: "Respond to every PWS task with a clear 'how we'll do it' — not just 'we understand the requirement.' Evaluators want evidence of methodology, not restatement of the requirement. Include process descriptions, staffing plans, transition approaches, and risk mitigation for complex tasks.",
      },
      {
        title: "Past performance volume",
        body: "Provide 3–5 references that are similar in size, scope, and complexity to the solicitation requirement. Each reference should include contract number, dollar value, period of performance, agency POC, and a brief narrative of relevance. Recency matters — older than 5 years rarely counts.",
      },
      {
        title: "Pricing / Cost volume",
        body: "Price to win, not to maximize margin. Research the government's independent cost estimate (IGCE) if available. For T&M or CPFF contracts, build a realistic labor category mix. For FFP, make sure your price reflects your actual cost of performance — underbidding to win and then losing money on execution is worse than not winning.",
      },
    ],
    bsNote: null,
  },
  {
    number: "06",
    label: "Submission & Award",
    headline: "Final compliance check before the deadline",
    time: "Final 48 hours",
    pain: "Last-minute submission errors and missing files have disqualified otherwise winning proposals",
    color: "#22c55e",
    steps: [
      {
        title: "Final compliance check",
        body: "48 hours before submission, do a final pass against Section L: check page counts, check all required forms are attached (SF33, representations and certifications, etc.), verify electronic submission requirements. One missing form can disqualify an otherwise winning proposal.",
      },
      {
        title: "Submit via the required method",
        body: "Most solicitations require submission via SAM.gov's Workspace, email, or a specified portal. Never submit only via email if a portal is listed — late or incorrect submissions are rejected. Submit early and confirm receipt. If the system is down (it happens), document your attempts and contact the contracting officer immediately.",
      },
      {
        title: "Award timeline",
        body: "Simple awards: 30–60 days after proposal due date. Complex acquisitions: 3–18 months. During evaluation, you may receive Evaluation Notices (ENs) or be invited to an oral presentation. Respond promptly and completely — a weak EN response can knock you from an otherwise strong position.",
      },
      {
        title: "If you lose — debrief",
        body: "You have a right to a debrief from the contracting officer within 5 days of award notification. Always request it. Debriefs reveal your scores, where you ranked, and what the winner did better. This intelligence directly improves your next bid. Most firms skip debriefs — don't.",
      },
    ],
    bsNote: null,
  },
];

const GLOSSARY = [
  ["SAM.gov", "System for Award Management — the federal vendor database and solicitation portal. Every federal contractor must be registered here."],
  ["NAICS Code", "North American Industry Classification System — a 6-digit code that classifies your business type. Your NAICS codes determine which solicitations you're eligible to bid on."],
  ["Set-Aside", "A solicitation reserved for a specific category of businesses: Small Business, 8(a), HUBZone, SDVOSB, WOSB. Only eligible firms can bid."],
  ["FAR", "Federal Acquisition Regulation — the primary set of rules governing federal government purchasing. Published at 48 CFR 1-53."],
  ["DFARS", "Defense Federal Acquisition Regulation Supplement — DoD-specific additions to the FAR that apply to defense contracts."],
  ["RFP", "Request for Proposals — the formal solicitation document. Contains scope of work, evaluation criteria, instructions, and contract terms."],
  ["PWS / SOW", "Performance Work Statement / Statement of Work — the section defining exactly what the contractor must do."],
  ["Section L", "Instructions to Offerors — tells you how to format and submit your proposal. Non-compliance = automatic rejection."],
  ["Section M", "Evaluation Criteria — tells you how the government will score your proposal. Priority order matters."],
  ["RTM", "Requirements Traceability Matrix — maps every solicitation requirement to a specific section of your proposal. Essential for compliance."],
  ["pWin", "Probability of Win — your estimated likelihood of being awarded the contract. Industry standard: only bid when pWin > 25–30%."],
  ["CMMC", "Cybersecurity Maturity Model Certification — required for DoD contracts that handle Controlled Unclassified Information (CUI). Three levels."],
  ["CPARS", "Contractor Performance Assessment Reporting System — where the government rates your past performance. These ratings follow you for 6 years."],
  ["IDIQ", "Indefinite Delivery, Indefinite Quantity — a contract vehicle that allows multiple task orders over a period. OASIS+, SEWP, STARS III are examples."],
  ["Debarment", "Exclusion from federal contracting. Can result from fraud, non-performance, or tax delinquency. Shown on SAM.gov exclusions list."],
];

export default function GovConGuide({ onBack, onEnterApp }) {
  const [openGlossary, setOpenGlossary] = useState(null);
  const [openPhase, setOpenPhase] = useState(null);

  useEffect(() => {
    document.title = "Federal Contracting Process Guide | BidSmith";
    window.scrollTo(0, 0);
    track("tool_page_view", { tool_name: "govcon_guide", path: "/govcon-guide" });
  }, []);

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            <button onClick={onBack} style={s.backBtn}>
              <ArrowLeft size={14} /> Back
            </button>
            <span style={s.brand}>BidSmith</span>
          </div>
          <button
            type="button"
            onClick={() => {
              track("hero_cta_click", { cta_label: "Try BidSmith Free", position: "govcon_guide_header" });
              onEnterApp?.();
            }}
            style={s.ctaBtn}
          >
            Try BidSmith Free <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main id="guide-main" style={s.main}>
        {/* Hero */}
        <section style={s.hero}>
          <p style={s.eyebrow}>Complete Reference Guide</p>
          <h1 style={s.h1}>The Federal Contracting Process<br />Explained End-to-End</h1>
          <p style={s.heroSub}>
            From first SAM.gov registration to contract award — the complete workflow
            every government contractor needs to understand. No fluff, no gatekeeping.
          </p>
          <div style={s.heroStats}>
            {[
              ["$750B+", "Annual federal contracting spend"],
              ["500,000+", "Active vendors on SAM.gov"],
              ["70%", "Proposals lose due to compliance failures"],
            ].map(([v, l]) => (
              <div key={l} style={s.heroStat}>
                <div style={s.heroStatVal}>{v}</div>
                <div style={s.heroStatLabel}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase timeline nav */}
        <nav style={s.phaseNav} aria-label="Process phases">
          {PHASES.map((p) => (
            <a key={p.number} href={`#phase-${p.number}`} style={s.phaseNavItem}>
              <span style={{ ...s.phaseNavNum, color: p.color }}>{p.number}</span>
              <span style={s.phaseNavLabel}>{p.label}</span>
            </a>
          ))}
        </nav>

        {/* Phases */}
        {PHASES.map((phase) => (
          <section
            key={phase.number}
            id={`phase-${phase.number}`}
            style={{ ...s.phaseSection, scrollMarginTop: 80 }}
          >
            <div style={s.phaseHeader}>
              <div style={{ ...s.phaseNum, color: phase.color, borderColor: phase.color }}>
                {phase.number}
              </div>
              <div style={s.phaseHeaderText}>
                <div style={s.phaseSuperLabel}>{phase.label}</div>
                <h2 style={s.phaseHeadline}>{phase.headline}</h2>
                <div style={s.phaseMeta}>
                  <span style={s.metaPill}>⏱ {phase.time}</span>
                  <span style={{ ...s.metaPill, background: "rgba(239,68,68,0.07)", color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }}>
                    ⚠ {phase.pain}
                  </span>
                </div>
              </div>
            </div>

            <div style={s.stepsGrid}>
              {phase.steps.map((step, i) => (
                <div key={i} style={s.stepCard}>
                  <div style={{ ...s.stepNum, color: phase.color }}>{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <h3 style={s.stepTitle}>{step.title}</h3>
                    <p style={s.stepBody}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {phase.bsNote && (
              <div style={s.bsCallout}>
                <div style={s.bsCalloutLabel}>
                  <span style={s.bsBadge}>BidSmith</span> How BidSmith handles this
                </div>
                <p style={s.bsCalloutText}>{phase.bsNote}</p>
                <button onClick={onEnterApp} style={s.bsCalloutBtn}>
                  See it in action <ArrowRight size={13} />
                </button>
              </div>
            )}
          </section>
        ))}

        {/* Glossary */}
        <section style={s.glossarySection}>
          <h2 style={s.sectionTitle}>GovCon Glossary</h2>
          <p style={s.sectionSub}>The terms every federal contractor needs to know — plain English.</p>
          <div style={s.glossaryGrid}>
            {GLOSSARY.map(([term, def], i) => (
              <div
                key={term}
                style={{ ...s.glossaryCard, cursor: "pointer" }}
                onClick={() => setOpenGlossary(openGlossary === i ? null : i)}
              >
                <div style={s.glossaryTop}>
                  <span style={s.glossaryTerm}>{term}</span>
                  {openGlossary === i ? <ChevronUp size={14} color="#52525b" /> : <ChevronDown size={14} color="#52525b" />}
                </div>
                {openGlossary === i && <p style={s.glossaryDef}>{def}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={s.bottomCta}>
          <h2 style={s.ctaTitle}>Stop spending 2 days on solicitation review</h2>
          <p style={s.ctaSub}>
            BidSmith audits any SAM.gov solicitation in under 90 seconds — compliance matrix,
            FAR/DFARS risk flags, source snippets, and bid/no-bid recommendation.
            Free to try. No account required.
          </p>
          <div style={s.ctaBtns}>
            <button onClick={onEnterApp} style={s.ctaBtnPrimary}>
              Run a Free Audit <ArrowRight size={15} />
            </button>
            <a href="/demo" style={s.ctaBtnSecondary}>
              Watch the Demo
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "var(--bg-page, #0a0c10)", color: "var(--text-primary, #f4f4f5)", fontFamily: "'Inter',sans-serif" },

  header: { borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,12,16,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1080, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  backBtn: { background: "none", border: "none", color: "#71717a", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem" },
  brand: { fontWeight: 900, letterSpacing: ".12em", fontSize: ".8rem" },
  ctaBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },

  main: { maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" },

  hero: { textAlign: "center", padding: "64px 0 48px" },
  eyebrow: { fontSize: "0.7rem", fontWeight: 700, letterSpacing: ".12em", color: "#6366f1", textTransform: "uppercase", marginBottom: 12 },
  h1: { fontSize: "clamp(1.8rem,5vw,2.8rem)", fontWeight: 900, letterSpacing: "-.02em", lineHeight: 1.15, margin: "0 0 20px" },
  heroSub: { fontSize: "1.05rem", color: "#71717a", lineHeight: 1.75, maxWidth: 620, margin: "0 auto 36px" },
  heroStats: { display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" },
  heroStat: { textAlign: "center" },
  heroStatVal: { fontSize: "1.5rem", fontWeight: 900, color: "#818cf8", marginBottom: 4 },
  heroStatLabel: { fontSize: "0.78rem", color: "#6b7280" },

  phaseNav: { display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 56, overflowX: "auto" },
  phaseNavItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 16px", textDecoration: "none", minWidth: 100, borderBottom: "2px solid transparent", transition: "border-color 0.2s" },
  phaseNavNum: { fontWeight: 900, fontSize: "0.9rem", fontFamily: "'JetBrains Mono',monospace" },
  phaseNavLabel: { fontSize: "0.62rem", color: "#6b7280", textAlign: "center", letterSpacing: ".03em" },

  phaseSection: { marginBottom: 64, paddingBottom: 64, borderBottom: "1px solid rgba(255,255,255,0.06)" },
  phaseHeader: { display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 32 },
  phaseNum: { fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: "2.5rem", lineHeight: 1, border: "1px solid", borderRadius: 8, padding: "6px 12px", opacity: 0.9, whiteSpace: "nowrap" },
  phaseHeaderText: { flex: 1 },
  phaseSuperLabel: { fontSize: "0.7rem", fontWeight: 700, letterSpacing: ".1em", color: "#6b7280", textTransform: "uppercase", marginBottom: 8 },
  phaseHeadline: { fontSize: "clamp(1.1rem,3vw,1.5rem)", fontWeight: 800, margin: "0 0 14px", lineHeight: 1.3 },
  phaseMeta: { display: "flex", gap: 8, flexWrap: "wrap" },
  metaPill: { fontSize: "0.72rem", background: "rgba(99,102,241,0.08)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 999, padding: "3px 10px" },

  stepsGrid: { display: "flex", flexDirection: "column", gap: 16 },
  stepCard: { display: "flex", gap: 16, padding: "18px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 },
  stepNum: { fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: "1rem", minWidth: 32, paddingTop: 1 },
  stepTitle: { fontWeight: 700, fontSize: "0.95rem", margin: "0 0 8px", color: "#e4e4e7" },
  stepBody: { margin: 0, fontSize: "0.9rem", color: "#9ca3af", lineHeight: 1.75 },

  bsCallout: { marginTop: 24, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "20px 24px" },
  bsCalloutLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: "0.72rem", fontWeight: 700, letterSpacing: ".06em", color: "#818cf8", textTransform: "uppercase", marginBottom: 10 },
  bsBadge: { background: "#4f46e5", color: "#fff", borderRadius: 4, padding: "1px 7px", fontSize: "0.65rem", fontWeight: 900, letterSpacing: ".08em" },
  bsCalloutText: { fontSize: "0.9rem", color: "#a5b4fc", lineHeight: 1.7, margin: "0 0 14px" },
  bsCalloutBtn: { background: "rgba(79,70,229,0.15)", color: "#818cf8", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 6, padding: "7px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },

  glossarySection: { marginBottom: 64 },
  sectionTitle: { fontSize: "1.5rem", fontWeight: 800, margin: "0 0 8px" },
  sectionSub: { color: "#71717a", margin: "0 0 28px", fontSize: "0.9rem" },
  glossaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 },
  glossaryCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "12px 14px" },
  glossaryTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  glossaryTerm: { fontWeight: 700, fontSize: "0.88rem", color: "#e4e4e7" },
  glossaryDef: { margin: "10px 0 0", fontSize: "0.82rem", color: "#9ca3af", lineHeight: 1.65 },

  bottomCta: { background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: 16, padding: "48px 40px", textAlign: "center" },
  ctaTitle: { fontSize: "clamp(1.2rem,3vw,1.8rem)", fontWeight: 900, margin: "0 0 16px" },
  ctaSub: { fontSize: "0.95rem", color: "#9ca3af", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 28px" },
  ctaBtns: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  ctaBtnPrimary: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 },
  ctaBtnSecondary: { background: "rgba(255,255,255,0.05)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: "13px 28px", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", display: "flex", alignItems: "center" },
};
