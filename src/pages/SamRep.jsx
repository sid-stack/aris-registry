import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Share2, Copy, Check, BadgeCheck } from 'lucide-react';

export default function SamRep({ onBack }) {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const reportTemplate = `## 📄 Federal-Proposal Report – Technical Content Checklist  

| Section | Must-have elements | Typical sub-headings / bullet points |
|---------|-------------------|--------------------------------------|
| **1. Header** | • Company name  <br>• CAGE code <br>• UEI (or DUNS) <br>• NAICS codes (optional) <br>• Point-of-contact (name, email, phone) | **CAGE CODE:** \`XXXX\` | **UEI:** \`YYYY\`<br>**Contact:** John Doe – john@example.com – (555) 123-4567 |
| **2. Executive Summary** | • One-sentence value proposition <br>• Business status (SDVOSB, VOSB, HUBZone, etc.) <br>• Key differentiators (AI-capture, speed, cost) <br>• High-level benefit to the agency | • **Mission fit** <br>• **Quantified impact** (e.g., "drafts proposals in < 10 min") |
| **3. Technical Approach** | • Overview of solution architecture <br>• Core capabilities (capture, analysis, report generation) <br>• Integration points (SAM.gov API, internal ERP, other data sources) <br>• Security & data-privacy controls | **3.1 Architecture Diagram** (optional) <br>**3.2 AI-Capture Engine** <br>**3.3 Data-Ingestion & Normalization** <br>**3.4 Output Formats (PDF, CSV, JSON)** <br>**3.5 Scalability & Performance** |
| **4. Management Plan** | • Project governance (PMO, steering committee) <br>• Roles & responsibilities <br>• Schedule milestones (Kick-off, Demo, Pilot, Full-scale rollout) <br>• Communication plan (status reports, meetings) <br>• Quality-assurance & testing procedures | **4.1 Team Structure** <br>**4.2 Milestone Timeline** (Gantt-style or table) <br>**4.3 Risk-Based QA** |
| **5. Past Performance / Case Studies** | • At least two relevant contracts (value, scope, outcome) <br>• Metrics that map to the current solicitation (time-to-draft, cost-savings, compliance) | **5.1 Client A – "AI-Capture Pilot"** (e.g., $2.5 M pilot, 30 days, 100% satisfaction) <br>**5.2 Client B – "Rapid Report Generation"** (e.g., 5 PB data processed, 40% faster) |
| **6. Risk Mitigation** | • Identify top 3-5 risks (schedule, security, integration, compliance) <br>• Concrete mitigation actions (contingency resources, automated audits) | Table format: <br>| Risk | Likelihood | Impact | Mitigation | |
| **7. Compliance & Certifications** | • List all federal certifications you hold (NIST 800-53, CMMC, FedRAMP, FISMA, HIPAA, etc.) <br>• Mention any cleared personnel (TS/SCI) if relevant | **7.1 Security Certifications** <br>**7.2 Government-Approved Standards** |
| **8. Pricing & Commercial Terms** | • Pilot fee (e.g., $2,500 flat) <br>• Subscription tiers (Starter $29/mo, Growth $299/mo, Enterprise custom) <br>• Payment terms (Stripe checkout, PO-based invoicing) <br>• Optional services (training, support) | **8.1 Pilot Package** <br>**8.2 Subscription Model** <br>**8.3 Discount / Referral Incentive** |
| **9. Appendices (optional)** | • Detailed technical specifications <br>• Sample screenshots / UI mock-ups <br>• Full API request/response schema <br>• Glossary of acronyms | **A. API Specification** <br>**B. UI Flow Diagram** |

---

### How to use the template

1. **Copy the Markdown skeleton** into your document generator (e.g., a Jinja2 template, a Python script, or a simple copy-paste).  
2. **Populate the placeholders** ({{company_name}}, {{award_id}}, {{pilot_fee}}, etc.) from the CSV you generated via the SAM.gov API.  
3. **Add a live-demo link** (e.g., https://demo.bidsmith.com?company={{uei}}) in the Executive Summary or Technical Approach so the prospect can click and see a customized walkthrough.  
4. **Export to PDF** (using a Markdown-to-PDF tool like pandoc or an HTML-to-PDF service) and attach it to your outreach email.  

---

#### Quick example (filled-in for a fictional prospect)

\`\`\`markdown
# Acme Defense Corp – Federal Proposal

**CAGE CODE:** \`1A2B3\` | **UEI:** \`Z9Y8X7W6V5U4\` | **Contact:** Jane Smith – jane.smith@acme.gov – (202) 555-0198  

## Executive Summary
Acme Defense Corp is a Service-Disabled Veteran-Owned Small Business (SDVOSB) seeking a rapid-response AI-capture engine to streamline its SAM.gov bid workflow. Our $2,500 Pilot delivers a complete draft proposal in < 10 minutes, cutting current drafting time by ≈ 90% and guaranteeing compliance with NIST 800-53 Rev 5 and CMMC 2.0 Level 3.

## Technical Approach
1. AI-Capture Engine – parses SAM.gov notices, extracts key data fields, and auto-populates a proposal template.  
2. Compliance Layer – built-in rule engine enforces FAR/DFARS clauses, automatically inserts required certifications.  
3. Delivery Pipeline – DevSecOps CI/CD creates a PDF/Word package and pushes it to the Acme SharePoint site.  

## Management Plan
- PMO Lead: John Doe (PMP) – weekly status calls, risk register.  
- Milestones: Kick-off (Day 0) → Demo (Day 7) → Pilot Review (Day 30) → Full Roll-out (Day 45).  

## Past Performance
- XYZ Federal Agency – $3.1 M Contract – reduced proposal drafting from 3 days to 30 minutes, 100% on-time delivery.  
- ABC Health Services – $1.8 M Contract – automated compliance reporting for HIPAA-covered data.  

## Risk Mitigation
| Risk               | Likelihood | Impact | Mitigation |
|--------------------|-----------|--------|------------|
| Schedule delay     | Medium    | High   | Agile sprints, buffer resources |
| Data-privacy breach| Low       | High   | End-to-end encryption, FedRAMP-High hosting |
| Integration failure| Medium    | Medium | Pre-pilot sandbox testing |

## Compliance Certification
- NIST SP 800-53 Rev 5  
- CMMC 2.0 Level 3  
- FedRAMP High  

## Pricing & Commercial Terms
- Pilot: $2,500 flat fee (30 days, unlimited support).  
- Starter: $29 / mo (up to 5 drafts).  
- Growth: $299 / mo (unlimited drafts, API access).  

## Appendices
- A. API Request/Response Schema (see attached JSON spec)  
- B. UI Mock-up (link to live demo: https://demo.bidsmith.com?uei=Z9Y8X7W6V5U4)
\`\`\``;

    const handleCopy = () => {
        navigator.clipboard.writeText(reportTemplate);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "Inter, sans-serif" }}>
            {/* Navigation */}
            <nav style={{
                height: 64,
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                padding: isMobile ? "0 16px" : "0 32px",
                position: "sticky",
                top: 0,
                zIndex: 10
            }}>
                <button
                    onClick={() => onBack ? onBack() : window.location.href = '/'}
                    style={{
                        background: "transparent",
                        border: "1px solid #e5e5e5",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#64748b",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer"
                    }}
                >
                    <ArrowLeft size={16} />
                    {isMobile ? "Back" : "Back to Home"}
                </button>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button
                        onClick={handleCopy}
                        style={{
                            background: copied ? "#10a37f" : "#4f46e5",
                            border: "none",
                            borderRadius: 8,
                            padding: isMobile ? "8px" : "8px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#ffffff",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {!isMobile && (copied ? "Copied!" : "Copy Template")}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div style={{
                padding: isMobile ? "40px 16px" : "64px 32px",
                maxWidth: 900,
                margin: "0 auto",
                textAlign: isMobile ? "left" : "center"
            }}>
                <div style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    background: "#eff6ff",
                    color: "#3b82f6",
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: 16
                }}>
                    Federal Sales Enablement
                </div>
                <h1 style={{
                    fontSize: isMobile ? 32 : 48,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    marginBottom: 20
                }}>
                    Prospect Technical Report Template
                </h1>
                <p style={{
                    fontSize: isMobile ? 16 : 18,
                    lineHeight: 1.6,
                    color: "#475569",
                    maxWidth: 700,
                    margin: isMobile ? "0" : "0 auto"
                }}>
                    Below is a <strong>technical‑report template</strong> you can reuse for every prospect you pitch with BidSmith.
                    It follows the structure that federal evaluators expect while keeping the language concise and data‑driven.
                </p>
            </div>

            {/* Value Prop Section */}
            <div style={{
                maxWidth: 960,
                margin: "0 auto 40px",
                padding: isMobile ? "0 16px" : "0 32px"
            }}>
                <div style={{
                    background: "#0f172a",
                    borderRadius: 16,
                    padding: isMobile ? "24px" : "40px",
                    color: "#f8fafc"
                }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#3b82f6" }}>Why BidSmith instead of just GPT?</h2>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <BadgeCheck size={20} color="#10a37f" /> Precision vs Hallucination
                            </h3>
                            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#94a3b8" }}>
                                GPT lacks real-time access to the **Section L & M** constraints of a specific SAM.gov bid. BidSmith's "Executive Auditor" extracts truth directly from the source PDF, eliminating hallucinations on compliance dates and CAGE code requirements.
                            </p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <BadgeCheck size={20} color="#10a37f" /> 100+ Page PDF Intelligence
                            </h3>
                            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#94a3b8" }}>
                                Standard LLMs choke on long federal solicitations. We implement a targeted extraction strategy that scans specifically for **disqualification traps**, saving your team ~14 hours of manual reading per bid.
                            </p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <BadgeCheck size={20} color="#10a37f" /> Compliance First Architecture
                            </h3>
                            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#94a3b8" }}>
                                We don't just "write". We **audit**. BidSmith identifies "Bid-Killer" risks (like missing SPRS scores or past performance thresholds) *before* you start drafting, ensuring zero-fluff, high-conviction outcomes.
                            </p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <BadgeCheck size={20} color="#10a37f" /> Institutional Knowledge
                            </h3>
                            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#94a3b8" }}>
                                BidSmith is built by federal capture experts. Our engine understands the nuance of **FAR/DFARS clauses**, SBA set-asides, and the agency-specific evaluation metrics that generic AI ignores.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div style={{
                maxWidth: 960,
                margin: "0 auto",
                padding: isMobile ? "0 16px 64px" : "0 32px 80px"
            }}>
                <div style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: isMobile ? "24px" : "48px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                }}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h2: ({ children }) => <h2 style={{ fontSize: 24, fontWeight: 700, borderTop: "1px solid #e2e8f0", paddingTop: 32, marginTop: 40, marginBottom: 20 }}>{children}</h2>,
                            h3: ({ children }) => <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>{children}</h3>,
                            h4: ({ children }) => <h4 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>{children}</h4>,
                            p: ({ children }) => <p style={{ fontSize: 16, lineHeight: 1.7, color: "#334155", marginBottom: 16 }}>{children}</p>,
                            ul: ({ children }) => <ul style={{ marginLeft: 24, marginBottom: 16 }}>{children}</ul>,
                            ol: ({ children }) => <ol style={{ marginLeft: 24, marginBottom: 16 }}>{children}</ol>,
                            li: ({ children }) => <li style={{ marginBottom: 8, color: "#334155", fontSize: 16, lineHeight: 1.7 }}>{children}</li>,
                            table: ({ children }) => (
                                <div style={{ overflowX: "auto", margin: "24px 0", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>{children}</table>
                                </div>
                            ),
                            th: ({ children }) => <th style={{ background: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, textAlign: "left", color: "#475569" }}>{children}</th>,
                            td: ({ children }) => <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", color: "#334155", verticalAlign: "top" }}>{children}</td>,
                            code: ({ children }) => <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.9em", color: "#475569" }}>{children}</code>,
                            pre: ({ children }) => (
                                <div style={{ position: "relative" }}>
                                    <pre style={{
                                        background: "#1e293b",
                                        color: "#f8fafc",
                                        padding: "24px",
                                        borderRadius: 12,
                                        overflowX: "auto",
                                        fontSize: 14,
                                        lineHeight: 1.5,
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        margin: "24px 0"
                                    }}>{children}</pre>
                                </div>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote style={{
                                    margin: "16px 0",
                                    padding: "16px 24px",
                                    background: "#fdf2f2",
                                    borderLeft: "4px solid #ef4444",
                                    color: "#991b1b",
                                    borderRadius: "0 8px 8px 0"
                                }}>{children}</blockquote>
                            )
                        }}
                    >
                        {reportTemplate}
                    </ReactMarkdown>
                </div>

                {/* Footer info */}
                <div style={{ marginTop: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                    <p>Feel free to copy‑paste the Markdown skeleton, replace the placeholders, and add any product‑specific metrics.</p>
                </div>
            </div>
        </div>
    );
}
