/**
 * SEO-optimized compliance guide pages.
 * Routes: /compliance/:slug
 * Targets high-intent GovCon search terms per the marketing strategy.
 */
import { useEffect } from "react";
import { ShieldCheck, FileText, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

// ── Content database — each slug maps to a full guide ──
const GUIDES = {
  "far-52-212-1": {
    title: "FAR 52.212-1 — Instructions to Offerors: Commercial Products",
    metaTitle: "FAR 52.212-1 Compliance Checklist | ARIS Federal Audit",
    metaDesc: "Complete guide to FAR 52.212-1 for government contractors. Offeror instructions, compliance requirements, and how ARIS auto-checks clause conformance in 90 seconds.",
    eyebrow: "FAR Part 52 · Commercial Acquisitions",
    intro: "FAR 52.212-1 governs how offerors must respond to solicitations for commercial products and services. Missing a single requirement under this clause is the most common cause of technical disqualification for small and mid-size contractors.",
    sections: [
      {
        heading: "What FAR 52.212-1 Requires",
        body: "This clause sets mandatory formatting, submission, and eligibility requirements for commercial item procurements. Key requirements include: unique entity identifier (SAM.gov registration active), signed offer with authorized signature, conformance to Section L page limits and format, and unit prices for all CLINs. Failure on any one item triggers immediate disqualification."
      },
      {
        heading: "Common Disqualification Triggers",
        items: [
          "SAM.gov registration expired or not renewed within 12 months",
          "Proposal does not conform to page limits stated in Section L",
          "Authorized signatory not listed as an officer in SAM entity record",
          "Missing certifications (e.g., small business size standard, representations)",
          "CLINs not fully priced or missing unit of measure",
          "No acknowledgment of all issued amendments"
        ]
      },
      {
        heading: "How ARIS Checks FAR 52.212-1 Compliance",
        body: "When you submit a SAM.gov solicitation URL to ARIS, the Mercury 2 engine extracts every FAR 52.212-1 sub-requirement from Section L, cross-references your compliance posture against the clause, and generates a line-by-line checklist. ARIS flags any clause where a mismatch exists — before your team invests 40 hours writing the proposal."
      }
    ],
    faqs: [
      { q: "Does FAR 52.212-1 apply to all federal contracts?", a: "FAR 52.212-1 applies specifically to solicitations for commercial products and services under FAR Part 12. It does not apply to non-commercial acquisitions under FAR Parts 13, 14, or 15, which use different offeror instruction clauses." },
      { q: "What happens if my proposal violates FAR 52.212-1?", a: "The contracting officer is required to reject the proposal as non-conforming. This is not discretionary — a missing SAM registration or unsigned offer cannot be remedied after submission. ARIS checks for these issues before you submit." },
      { q: "How do I quickly check my SAM registration status?", a: "Go to SAM.gov and search your entity's CAGE code or UEI. Registration must show 'Active' and have a renewal date at least 12 months from solicitation close. ARIS automatically verifies this as part of the compliance audit." }
    ]
  },
  "section-l-analysis": {
    title: "Section L Analysis — How to Extract RFP Requirements",
    metaTitle: "Section L Compliance Matrix Guide for GovCon | ARIS",
    metaDesc: "How to read Section L of a federal RFP and build a compliance matrix. ARIS automates Section L requirement extraction and maps every item to Section M evaluation criteria.",
    eyebrow: "Proposal Compliance · Section L/M",
    intro: "Section L of a federal solicitation contains every submission instruction your proposal must satisfy. Section M tells evaluators how they will score your response. Understanding both — and the relationship between them — is the single highest-leverage skill in government contracting.",
    sections: [
      {
        heading: "What Section L Contains",
        body: "Section L (Instructions, Conditions, and Notices to Offerors) specifies: volume structure and page limits, formatting requirements (font, margins, headers), required certifications and representations, content requirements for each volume (Technical, Management, Past Performance, Price), and submission method and deadline. Every requirement in Section L is a potential disqualification trigger."
      },
      {
        heading: "How to Build a Section L Compliance Matrix",
        items: [
          "Read Section L in full — including all cross-references to FAR/DFARS clauses",
          "Create a table with columns: Requirement | Source (page/section) | Assigned Writer | Status",
          "Map each Section L requirement to the corresponding Section M evaluation factor",
          "Flag any requirement with ambiguous language for contracting officer clarification",
          "Conduct a compliance review 72 hours before submission using your matrix",
          "Never submit without a signed compliance check against every Section L line item"
        ]
      },
      {
        heading: "How ARIS Automates This in 90 Seconds",
        body: "ARIS reads the full solicitation, identifies every Section L requirement (including those embedded in incorporated FAR clauses), and outputs a structured compliance matrix with source citations, risk flags, and Section M cross-references. What takes a capture analyst 2–3 days takes ARIS 41–90 seconds."
      }
    ],
    faqs: [
      { q: "What is the difference between Section L and Section M?", a: "Section L tells you what to submit and how to submit it. Section M tells evaluators how they will judge what you submitted. Together, they form the complete compliance and evaluation framework. A strong proposal satisfies every Section L requirement while explicitly addressing every Section M factor." },
      { q: "Can I use the same proposal for multiple solicitations?", a: "No. Every federal solicitation has unique Section L requirements. Submitting a proposal that does not conform to the specific page limits, volume structure, and format requirements of the target solicitation will result in disqualification — regardless of technical merit." },
      { q: "What is a compliance matrix?", a: "A compliance matrix is a spreadsheet or table that maps every Section L requirement to the section of your proposal that addresses it. It is used internally during proposal development to ensure nothing is missed, and is often submitted as a required volume in the proposal itself." }
    ]
  },
  "compliance-matrix-guide": {
    title: "Compliance Matrix Guide — Build One in 5 Minutes with AI",
    metaTitle: "Compliance Matrix Generator for Federal RFPs | ARIS GovCon Tool",
    metaDesc: "Learn how to build a federal RFP compliance matrix. ARIS generates a full compliance matrix from any SAM.gov solicitation in under 90 seconds — free to try.",
    eyebrow: "GovCon Fundamentals · Compliance Matrix",
    intro: "A compliance matrix is the foundation of every winning federal proposal. It maps every requirement in Section L to your proposal response — ensuring nothing is missed and evaluators can score you easily. Manual matrix creation takes 2–3 days. ARIS does it in 90 seconds.",
    sections: [
      {
        heading: "Why Compliance Matrices Win Contracts",
        body: "Federal evaluators score proposals against published criteria. A compliance matrix makes your proposal reviewer-friendly: every requirement is clearly addressed, easily cross-referenced, and presented in the exact order the government asked. Proposals without compliance matrices are statistically more likely to be rated 'Unacceptable' on technical factors — not because the work is weak, but because reviewers can't find where requirements are addressed."
      },
      {
        heading: "Anatomy of a Federal Compliance Matrix",
        items: [
          "Column 1: Requirement text (verbatim from Section L)",
          "Column 2: FAR/DFARS clause reference if applicable",
          "Column 3: Section M evaluation factor it addresses",
          "Column 4: Volume and page number in your proposal",
          "Column 5: Compliance status (Compliant / Partial / Pending)",
          "Column 6: Owner (proposal team member responsible)"
        ]
      },
      {
        heading: "ARIS Compliance Matrix vs Manual Build",
        body: "ARIS Mercury 2 reads your solicitation, extracts every Section L requirement, maps it to Section M evaluation factors, flags FAR/DFARS compliance obligations, and exports a complete RTM (Requirements Traceability Matrix) as a CSV you can use immediately. The same output takes a senior capture analyst 18–40 hours to build manually."
      }
    ],
    faqs: [
      { q: "Is a compliance matrix required in a federal proposal?", a: "Some solicitations explicitly require a compliance matrix as a separate volume. All well-run proposals include one regardless — it protects against technical disqualification and speeds up evaluation scoring, which directly improves your LPTA and best-value competitive position." },
      { q: "What format should a compliance matrix be?", a: "Typically a spreadsheet (Excel or CSV) or a table in the Technical Volume. ARIS exports in CSV format compatible with Excel, Google Sheets, and any proposal management tool. When submitted as a volume, format it according to Section L font/margin specifications." },
      { q: "Can AI build an accurate compliance matrix?", a: "Yes — ARIS achieves high accuracy by grounding every extraction directly in the solicitation text with source citations. Each requirement in the ARIS matrix links back to the page and section it was extracted from, allowing your team to verify every item before proposal submission." }
    ]
  },
  "bid-no-bid-framework": {
    title: "Bid / No-Bid Decision Framework for Government Contractors",
    metaTitle: "Bid No-Bid Decision Framework for Federal Contracts | ARIS",
    metaDesc: "A structured bid/no-bid decision framework for GovCon capture teams. ARIS auto-scores every solicitation for compliance risk, win probability, and go/no-go recommendation.",
    eyebrow: "Capture Management · Bid Strategy",
    intro: "The bid/no-bid decision is the most important — and most frequently skipped — step in the capture process. Teams that pursue every opportunity they're technically eligible for lose money. A disciplined bid/no-bid process concentrates your proposal resources on opportunities you can actually win.",
    sections: [
      {
        heading: "The 7 Factors of a Bid/No-Bid Decision",
        items: [
          "Compliance posture: Can we meet every Section L/M requirement today?",
          "Past performance: Do we have relevant and recent CPARs for this work?",
          "Incumbent analysis: Is there an incumbent? What is their re-compete probability?",
          "Set-aside eligibility: Does our socio-economic status qualify for this set-aside?",
          "Price-to-win estimate: Can we price competitively given our cost structure?",
          "Bandwidth: Do we have the proposal team bandwidth to execute a quality submission?",
          "Strategic fit: Does winning this contract advance our portfolio goals?"
        ]
      },
      {
        heading: "How ARIS Automates the Compliance Factors",
        body: "ARIS handles the most time-consuming part of the bid/no-bid process: compliance risk assessment. The Mercury 2 engine reads the solicitation, scores your compliance posture against every FAR/DFARS requirement, checks for set-aside restrictions, and generates a bid/no-bid recommendation with a numeric risk score. What takes a capture manager half a day takes ARIS 90 seconds."
      },
      {
        heading: "Typical Bid/No-Bid Scoring Rubric",
        items: [
          "Score 0–30: No-Bid. Fatal compliance issues or no realistic competitive position.",
          "Score 31–59: Conditional Bid. Significant risks require mitigation before pursuing.",
          "Score 60–79: Qualified Bid. Strong compliance posture, proceed with capture planning.",
          "Score 80–100: Strong Bid. High compliance alignment and competitive differentiators."
        ]
      }
    ],
    faqs: [
      { q: "How do you decide whether to bid on a government contract?", a: "A disciplined bid/no-bid process evaluates: technical compliance, past performance relevance, set-aside eligibility, incumbent presence, price-to-win feasibility, and proposal bandwidth. ARIS automates the compliance scoring component, giving your capture team an evidence-based starting point for the bid/no-bid discussion in under 90 seconds." },
      { q: "What is a capture plan?", a: "A capture plan is the strategic document that guides your team's effort to win a specific opportunity. It includes competitive analysis, win themes, price-to-win estimates, teaming strategy, and action items for the proposal phase. Effective capture planning begins at least 6 months before RFP release." },
      { q: "What is win probability in GovCon?", a: "Win probability (Pwin) is an estimate of your likelihood of winning a specific opportunity, typically expressed as a percentage. Factors include: competitive advantage, relationship with the customer, past performance strength, price competitiveness, and compliance posture. ARIS contributes the compliance posture component of Pwin." }
    ]
  },
  "dfars-252-204-7012": {
    title: "DFARS 252.204-7012 — Safeguarding Covered Defense Information",
    metaTitle: "DFARS 252.204-7012 Compliance Guide | ARIS Federal Contractor Tool",
    metaDesc: "DFARS 252.204-7012 compliance requirements for defense contractors. Safeguarding covered defense information, NIST SP 800-171, and cyber incident reporting. ARIS flags this clause automatically.",
    eyebrow: "DFARS · Cybersecurity Compliance",
    intro: "DFARS 252.204-7012 is one of the most significant compliance requirements in defense contracting. It mandates that contractors handling Covered Defense Information (CDI) implement 110 security controls from NIST SP 800-171 and report cyber incidents to DoD within 72 hours.",
    sections: [
      {
        heading: "What DFARS 252.204-7012 Requires",
        items: [
          "Implement all 110 controls in NIST SP 800-171 Rev 2",
          "Submit a System Security Plan (SSP) if requested by the Contracting Officer",
          "Create a Plan of Action & Milestones (POA&M) for any unimplemented controls",
          "Report cyber incidents to DoD via dibnet.dod.mil within 72 hours",
          "Flow down clause requirements to all subcontractors handling CDI",
          "Preserve images of compromised systems for 90 days post-incident"
        ]
      },
      {
        heading: "CMMC and DFARS 252.204-7012",
        body: "Starting in 2025, DoD is implementing CMMC (Cybersecurity Maturity Model Certification) to verify DFARS 252.204-7012 compliance. CMMC Level 2 requires a third-party assessment for contracts involving CDI. Contractors who cannot demonstrate 110-control compliance will be ineligible for award on affected solicitations. ARIS flags DFARS 252.204-7012 presence and CMMC level requirements in every audit."
      },
      {
        heading: "How ARIS Detects DFARS 252.204-7012 in Solicitations",
        body: "ARIS reads your solicitation and flags every instance of DFARS 252.204-7012, related cybersecurity clauses (including DFARS 252.204-7008, 7019, 7020), and CMMC level requirements. If the clause is present and your assessment status is unclear, ARIS marks this as a disqualification risk in the compliance matrix."
      }
    ],
    faqs: [
      { q: "What is Covered Defense Information (CDI)?", a: "CDI is unclassified controlled technical information or other information that requires safeguarding or dissemination controls per DoD policy. If a solicitation involves CDI, DFARS 252.204-7012 almost certainly applies, and CMMC compliance may be required for award." },
      { q: "What happens if I don't comply with DFARS 252.204-7012?", a: "Non-compliance is a material breach of the contract. Consequences include: contract termination for default, suspension and debarment proceedings, False Claims Act liability if compliance was falsely certified, and mandatory cyber incident reporting failures can result in criminal exposure." },
      { q: "Do subcontractors need to comply with DFARS 252.204-7012?", a: "Yes. The prime contractor is required to flow down DFARS 252.204-7012 to all subcontractors that will process, store, or transmit CDI. The prime is responsible for subcontractor compliance and must verify it before award and periodically during performance." }
    ]
  },
  "rtm-generator": {
    title: "RTM Generator — Requirements Traceability Matrix for Federal Proposals",
    metaTitle: "RTM Generator for Federal RFPs — Free Compliance Matrix Export | ARIS",
    metaDesc: "Generate a Requirements Traceability Matrix (RTM) from any SAM.gov solicitation in seconds. ARIS exports RTMs as CSV — ready for your proposal management system.",
    eyebrow: "Proposal Tools · RTM",
    intro: "A Requirements Traceability Matrix (RTM) is a formal document that traces every solicitation requirement from source to your proposal response. Federal evaluators use RTMs to confirm compliance during technical review. ARIS generates an RTM automatically from any SAM.gov solicitation.",
    sections: [
      {
        heading: "What Goes in an RTM",
        items: [
          "Requirement ID (auto-assigned or from solicitation PWS/SOW)",
          "Requirement text (verbatim from Section L, SOW, or PWS)",
          "Source section and page number in the solicitation",
          "Mapped Section M evaluation factor",
          "Applicable FAR/DFARS clause reference",
          "Proposal volume and section where requirement is addressed",
          "Compliance status: Compliant | Partial | Exception | Not Addressed"
        ]
      },
      {
        heading: "RTM vs Compliance Matrix: What's the Difference?",
        body: "A compliance matrix maps Section L submission instructions to your proposal sections. An RTM goes deeper — it traces every performance requirement in the PWS/SOW through your technical approach to the deliverable or acceptance criterion. Large DOD contracts often require both. ARIS generates both in a single audit run."
      },
      {
        heading: "ARIS RTM Export",
        body: "After an ARIS audit, click 'Export RTM' to download a CSV containing every extracted requirement with source citations, Section M mappings, and compliance flags. The export is formatted for direct import into proposal management tools. Standard audits export the compliance matrix; Enterprise deep-shreds generate the full performance RTM."
      }
    ],
    faqs: [
      { q: "Is an RTM required in a federal proposal?", a: "Not all solicitations require an RTM, but many DOD and civilian agency procurements above the simplified acquisition threshold do. Check Section L specifically — if an RTM is required, it will be stated explicitly with format and content requirements." },
      { q: "How long does it take to build an RTM manually?", a: "For a typical 200-page DOD solicitation, manually building a complete RTM takes a senior proposal manager 8–20 hours. ARIS generates the initial RTM in under 90 seconds, giving your team a structured starting point that requires review and completion rather than construction from scratch." },
      { q: "What file format does ARIS RTM export in?", a: "ARIS exports RTMs as CSV files compatible with Excel, Google Sheets, and all major proposal management platforms. Enterprise plan audits can request custom column mappings for specific tool integrations." }
    ]
  }
};

export default function CompliancePage({ slug, onBack }) {
  const guide = GUIDES[slug];

  useEffect(() => {
    if (!guide) return;
    document.title = guide.metaTitle;
    const d = document.querySelector('meta[name="description"]');
    if (d) d.setAttribute("content", guide.metaDesc);

    // Inject Article + FAQ schema for this page
    const existing = document.getElementById("compliance-schema");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "compliance-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "headline": guide.title,
          "description": guide.metaDesc,
          "url": `https://www.bidsmith.pro/compliance/${slug}`,
          "publisher": {
            "@type": "Organization",
            "name": "ARIS Labs",
            "url": "https://www.bidsmith.pro"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": guide.faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
          }))
        }
      ]
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [guide, slug]);

  if (!guide) {
    return (
      <div style={s.page}>
        <div style={s.inner}>
          <button onClick={onBack} style={s.backBtn}>← Back</button>
          <h1 style={s.h1}>Guide not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <button onClick={onBack} style={s.backBtn}>← Back to ARIS</button>

        <p style={s.eyebrow}>{guide.eyebrow}</p>
        <h1 style={s.h1}>{guide.title}</h1>
        <p style={s.intro}>{guide.intro}</p>

        {guide.sections.map((sec, i) => (
          <div key={i} style={s.section}>
            <h2 style={s.h2}>{sec.heading}</h2>
            {sec.body && <p style={s.body}>{sec.body}</p>}
            {sec.items && (
              <ul style={s.list}>
                {sec.items.map((item, j) => (
                  <li key={j} style={s.listItem}>
                    <CheckCircle2 size={14} color="#00FFC2" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* FAQ */}
        <div style={s.section}>
          <h2 style={s.h2}>Frequently Asked Questions</h2>
          {guide.faqs.map((faq, i) => (
            <div key={i} style={s.faqItem}>
              <h3 style={s.faqQ}>{faq.q}</h3>
              <p style={s.faqA}>{faq.a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={s.cta}>
          <ShieldCheck size={28} color="#00FFC2" />
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#f4f4f5" }}>
              Auto-check this compliance requirement in 90 seconds
            </h3>
            <p style={{ margin: "4px 0 0", color: "#71717a", fontSize: "0.9rem" }}>
              Paste any SAM.gov URL — ARIS extracts every requirement like this and flags your risk posture automatically.
            </p>
          </div>
          <button onClick={onBack} style={s.ctaBtn}>
            Launch ARIS Audit <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </button>
        </div>

        {/* Related guides */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ ...s.eyebrow, marginBottom: 16 }}>Related Guides</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Object.entries(GUIDES).filter(([k]) => k !== slug).slice(0, 4).map(([k, g]) => (
              <a
                key={k}
                href={`/compliance/${k}`}
                style={s.relatedLink}
                onClick={e => { e.preventDefault(); window.location.href = `/compliance/${k}`; }}
              >
                <FileText size={12} style={{ marginRight: 6 }} />
                {g.title.split("—")[0].trim()}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#05070A",
    color: "#e4e4e7",
    fontFamily: "'Inter', sans-serif",
    paddingBottom: 80,
  },
  inner: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "40px 24px",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    fontSize: "0.875rem",
    padding: "0 0 24px",
    display: "block",
  },
  eyebrow: {
    margin: "0 0 8px",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#00FFC2",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  h1: {
    margin: "0 0 20px",
    fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
    fontWeight: 800,
    lineHeight: 1.2,
    color: "#f4f4f5",
  },
  intro: {
    fontSize: "1.05rem",
    lineHeight: 1.7,
    color: "#a1a1aa",
    margin: "0 0 40px",
    paddingBottom: 32,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  section: {
    marginBottom: 40,
  },
  h2: {
    margin: "0 0 14px",
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#f4f4f5",
  },
  body: {
    margin: 0,
    fontSize: "0.95rem",
    lineHeight: 1.7,
    color: "#a1a1aa",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  listItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: "0.95rem",
    color: "#a1a1aa",
    lineHeight: 1.5,
  },
  faqItem: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  faqQ: {
    margin: "0 0 8px",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#f4f4f5",
  },
  faqA: {
    margin: 0,
    fontSize: "0.95rem",
    lineHeight: 1.7,
    color: "#a1a1aa",
  },
  cta: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    background: "rgba(0,255,194,0.05)",
    border: "1px solid rgba(0,255,194,0.2)",
    borderRadius: 14,
    padding: "24px 28px",
    marginTop: 48,
    flexWrap: "wrap",
  },
  ctaBtn: {
    background: "#00FFC2",
    color: "#000",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    marginLeft: "auto",
  },
  relatedLink: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: "0.8rem",
    color: "#a1a1aa",
    textDecoration: "none",
    cursor: "pointer",
  },
};
