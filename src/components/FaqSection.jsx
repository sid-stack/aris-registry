import { useState } from "react";

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

function FaqItem({ question, answer, open, onToggle, isDark }) {
  return (
    <div
      style={{
        background: isDark ? "#1e293b" : "#ffffff",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        borderRadius: "12px",
        boxShadow: isDark ? "0 4px 6px -1px rgba(0,0,0,0.3)" : "0 4px 6px -1px rgba(0,0,0,0.05)",
        overflow: "hidden",
        marginBottom: "12px",
        transition: "all 0.2s ease-in-out",
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
          padding: "18px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
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
            background: isDark ? "#312e81" : "#eef2ff",
            color: isDark ? "#818cf8" : "#4f46e5",
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
            color: isDark ? "#f8fafc" : "#0f172a",
            fontSize: "1.05rem",
            lineHeight: 1.4,
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {question}
        </span>
        <span
          style={{
            color: isDark ? "#94a3b8" : "#94a3b8",
            fontSize: "1.2rem",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
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
        <div style={{ overflow: "hidden" }}>
          <p
            style={{
              padding: "0 20px 20px 62px",
              margin: 0,
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: isDark ? "#cbd5e1" : "#475569",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection({ isDark = false }) {
  const [openIndex, setOpenIndex] = useState(0);

  const items = [
    {
      q: "How does the Aris Protocol accelerate RFP responses?",
      a: "The discovery engine routes your query to the best-fit agent in milliseconds. Instead of manual document review, teams move from opportunity identification to a highly compliant first draft in under 10 minutes.",
    },
    {
      q: "Will my bids be compliant with SAM.gov requirements?",
      a: "Yes. Every request passes through a rigorous semantic validation against FAR/DFARS thresholds before the proposal is stitched together. Missing clauses or risk factors are flagged immediately.",
    },
    {
      q: "What is the pricing model?",
      a: "We offer transparent commercial tiers: a $29/mo Starter plan (200 calls), a $199/mo Growth plan (1,000 calls), a $2,500 30-day Pilot, and Custom Enterprise options for high-volume integrators.",
    },
    {
      q: "Does this actually improve win rates?",
      a: "Win-rate lift is derived from two factors: pipeline coverage (you can bid on more contracts) and compliance purity (you are less likely to be disqualified on technicalities).",
    },
    {
      q: "Can we run this with our own proprietary agents or data?",
      a: "Absolutely. The Aris SDK allows you to register custom agent capabilities while continuing to use our standard discovery and payload delivery rails.",
    },
    {
      q: "Is my proprietary data secure?",
      a: "Yes. The Aris Protocol utilizes a zero-knowledge execution environment. Handshakes use signed intent tokens, and payloads are delivered directly between secure endpoints without being stored by intermediaries.",
    },
    {
      q: "How fast can we see ROI?",
      a: "Most teams experience significant cycle-time compression within the first week. The 30-day pilot is specifically designed to validate compliance lift and throughput improvements before moving to production.",
    },
  ];

  return (
    <section style={{ padding: "80px 20px", background: isDark ? "#0f172a" : "#f8fafc", borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}` }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p
            style={{
              margin: "0 0 10px",
              color: isDark ? "#818cf8" : "#4f46e5",
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Common Questions
          </p>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: isDark ? "#f8fafc" : "#0f172a",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.02em"
            }}
          >
            Built for Scale and Security
          </h2>
          <p
            style={{
              marginTop: "12px",
              fontSize: "1.05rem",
              color: isDark ? "#94a3b8" : "#64748b",
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: "12px auto 0",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Learn how the Aris Protocol transforms federal capture management.
          </p>
        </div>

        <div>
          {items.map((item, idx) => (
            <FaqItem
              key={item.q}
              question={item.q}
              answer={item.a}
              open={openIndex === idx}
              onToggle={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
              isDark={isDark}
            />
          ))}
        </div>
      </div >
    </section >
  );
}
