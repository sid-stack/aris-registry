import React, { useState } from "react";

const QuestionIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

function FaqItem({ question, answer, open, onToggle }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        overflow: "hidden",
        marginBottom: "12px",
        transition: "all 0.2s ease-in-out",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box"
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          textAlign: "left",
          padding: "clamp(14px, 3vw, 18px) clamp(16px, 4vw, 20px)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          minHeight: "44px", // Industry standard touch target
          boxSizing: "border-box",
          overflow: "hidden",
          maxWidth: "100%"
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#eef2ff",
            color: "#4f46e5",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <QuestionIcon />
        </span>
        <span
          style={{
            flex: 1,
            fontWeight: 700,
            color: "#0f172a",
            fontSize: "clamp(0.95rem, 2.5vw, 1.05rem)",
            lineHeight: 1.4,
            fontFamily: "'Inter', sans-serif",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
            paddingRight: "8px",
            minWidth: 0, // Important for flexbox text truncation
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical"
          }}
        >
          {question}
        </span>
        <span
          style={{
            color: "#475569",
            fontSize: "1.2rem",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transition: "all 0.3s ease-in-out",
        }}
      >
        <div style={{ 
          overflow: "hidden",
          width: "100%",
          maxWidth: "100%"
        }}>
          <div
            style={{
              padding: "0 clamp(12px, 3vw, 20px) clamp(12px, 3vw, 20px) clamp(40px, 8vw, 62px)",
              margin: 0,
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              lineHeight: 1.6,
              color: "#475569",
              fontFamily: "'Inter', sans-serif",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              overflow: "hidden"
            }}
          >
            {answer.split('\n').map((paragraph, idx) => (
              <p key={idx} style={{ 
                margin: "0 0 8px 0",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                hyphens: "auto",
                maxWidth: "100%",
                overflow: "hidden"
              }}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const items = [
    {
      q: "What is ARIS and what does it do for government contractors?",
      a: "ARIS is an AI-powered federal solicitation audit engine built for government contractors. It reads any SAM.gov RFP and produces a structured compliance matrix, FAR/DFARS clause extraction, disqualification risk flags, and a bid/no-bid recommendation — all in under 90 seconds. It replaces 18–40 hours of manual solicitation review with one automated audit screen.",
    },
    {
      q: "How does ARIS generate a compliance matrix from an RFP?",
      a: "ARIS ingests the full solicitation text from SAM.gov, parses every clause and requirement, then maps each item to the relevant FAR/DFARS section. The output is a structured compliance matrix showing which requirements are met, which are missing, and which carry disqualification risk — formatted for immediate use by your capture and proposal team.",
    },
    {
      q: "Does ARIS integrate with SAM.gov?",
      a: "Yes. ARIS connects directly to SAM.gov to pull solicitation documents, amendments, and attachments. You can paste a SAM.gov notice ID or URL and ARIS will retrieve and audit the full opportunity automatically. The Discovery feed also surfaces new relevant solicitations matched to your NAICS codes without manual searching.",
    },
    {
      q: "What FAR and DFARS clauses does ARIS check?",
      a: "ARIS checks all standard FAR Part 52 clauses and DFARS 252 clauses present in a solicitation, including common disqualifiers like unique entity registration requirements, small business set-aside eligibility, cybersecurity certifications (CMMC), and past performance thresholds. The audit flags any clause where a contractor mismatch could result in disqualification before your team invests proposal resources.",
    },
    {
      q: "Is my solicitation data stored or shared?",
      a: "No. ARIS uses a zero-knowledge execution architecture. Solicitation data is processed transiently in memory during your session and is not persisted, indexed, or shared with any third party. Each session is isolated and wiped on completion. You can review our full data handling policy at bidsmith.pro/soc.",
    },
    {
      q: "How much does ARIS cost?",
      a: "ARIS offers four tiers. Free: 3 audits per month, no credit card required. Starter: $99/month for 1 full RFP audit with basic compliance matrix and PDF/SAM.gov support. Pro: $299/month for unlimited audits with full FAR/DFARS analysis, compliance matrix, risk score, bid/no-bid recommendation, and multi-format export. Enterprise: $999/month for deep-shred analysis including capture strategy, win themes, competitive positioning, and a dedicated GovCon consultant. Annual billing saves 20% on paid plans.",
    },
    {
      q: "Can ARIS help with bid/no-bid decisions?",
      a: "Yes. Every ARIS audit concludes with a structured bid/no-bid recommendation based on your compliance posture, risk score, and the solicitation's stated evaluation criteria. The recommendation includes specific reasons for each factor so your capture lead can make an informed go/no-go decision in minutes rather than days.",
    },
    {
      q: "What is the difference between Pro and Enterprise plans?",
      a: "Pro ($299/month) covers unlimited solicitation audits with the full compliance matrix, FAR/DFARS risk scoring, and bid/no-bid recommendation — ideal for capture managers tracking an active pipeline. Enterprise ($999/month) adds a deep-shred analysis layer: capture strategy, win theme development, competitive positioning, executive-ready briefing outputs for high-value single opportunities, and a dedicated GovCon consultant.",
    },
    {
      q: "How fast does ARIS produce an audit?",
      a: "A standard ARIS audit completes in under 90 seconds for most solicitations. Complex multi-attachment RFPs may take up to 3 minutes. The Enterprise deep-shred analysis typically completes in under 10 minutes. Compare that to 18–40 hours of manual review by a capture analyst or $5,000–$15,000 for a compliance consultant engagement.",
    },
    {
      q: "Does ARIS replace a proposal writer or capture manager?",
      a: "No — ARIS augments your team, it does not replace it. ARIS handles the mechanical compliance audit and risk analysis that consumes most of a capture manager's time. Your team retains full control over proposal strategy, win theme development, and final submission. Think of ARIS as giving every proposal professional a 40-hour head start on every bid.",
    },
  ];

  return (
    <section style={{ 
      padding: "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 20px)", 
      background: "#f8fafc", 
      borderTop: "1px solid #e2e8f0",
      overflow: "hidden"
    }}>
      <div style={{ 
        maxWidth: "800px", 
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(24px, 6vw, 40px)" }}>
          <p
            style={{
              margin: "0 0 10px",
              color: "#4f46e5",
              fontSize: "clamp(0.75rem, 2vw, 0.8rem)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontFamily: "'Inter', sans-serif",
              wordWrap: "break-word",
              overflowWrap: "break-word"
            }}
          >
            Common Questions
          </p>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "#0f172a",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
              maxWidth: "100%"
            }}
          >
            Built for Scale and Security
          </h2>
          <p
            style={{
              marginTop: "12px",
              fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)",
              color: "#64748b",
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: "12px auto 0",
              fontFamily: "'Inter', sans-serif",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto"
            }}
          >
            Learn how Aris Protocol transforms federal capture management.
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: "100%" }}>
          {items.map((item, idx) => (
            <FaqItem
              key={item.q}
              question={item.q}
              answer={item.a}
              open={openIndex === idx}
              onToggle={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
