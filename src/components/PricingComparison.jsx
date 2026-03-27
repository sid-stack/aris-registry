/**
 * Side-by-side plan comparison table with ✓ / ✗ per feature per tier.
 * Replaces the legacy card grid in Landing.jsx#pricing.
 */
import { GTM_PRICING_PLANS, STRIPE_PAYMENT_LINKS } from "../lib/pricing";

const CHECK = "✓";
const CROSS  = "✗";

/** [label, starter, pro, enterprise] */
const FEATURES = [
  ["Audits per month",              "1 session",  "Unlimited",  "Unlimited"],
  ["Compliance matrix",             CHECK,        CHECK,        CHECK],
  ["Gap Analysis Interface",        CHECK,        CHECK,        CHECK],
  ["Multi-section extraction",      CROSS,        CHECK,        CHECK],
  ["Requirement editing",           CROSS,        CHECK,        CHECK],
  ["Multi-format export",           CROSS,        CHECK,        CHECK],
  ["Team collaboration",            CROSS,        CROSS,        CHECK],
  ["Priority processing",           CROSS,        CROSS,        CHECK],
  ["Dedicated Consultant",          CROSS,        CROSS,        CHECK],
];

const PLAN_KEYS = ["starter", "pro", "enterprise"];

export default function PricingComparison({ onPlanClick, disabled }) {
  return (
    <div style={s.wrapper}>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, ...s.featureCol }}>Feature</th>
              {GTM_PRICING_PLANS.map((plan) => (
                <th key={plan.key} style={{ ...s.th, ...s.planCol }}>
                  {plan.badge && (
                    <span style={s.badge}>{plan.badge}</span>
                  )}
                  <div style={s.planName}>{plan.title}</div>
                  <div style={s.planPrice}>{plan.price}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {FEATURES.map(([label, starter, pro, enterprise], i) => {
              const vals = [starter, pro, enterprise];
              return (
                <tr key={label} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                  <td style={{ ...s.td, ...s.featureCol, color: "#d4d4d8" }}>{label}</td>
                  {vals.map((v, j) => (
                    <td key={j} style={{ ...s.td, ...s.planCol }}>
                      <span
                        style={
                          v === CHECK
                            ? s.check
                            : v === CROSS
                            ? s.cross
                            : s.value
                        }
                      >
                        {v}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* CTA row */}
            <tr style={s.ctaRow}>
              <td style={{ ...s.td, ...s.featureCol }} />
              {GTM_PRICING_PLANS.map((plan) => (
                <td key={plan.key} style={{ ...s.td, ...s.planCol }}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPlanClick && onPlanClick(plan)}
                    style={{
                      ...s.ctaBtn,
                      ...(plan.key === "standard" ? s.ctaBtnPrimary : {}),
                      ...(disabled ? s.ctaBtnDisabled : {}),
                    }}
                  >
                    {plan.buttonLabel}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    marginTop: 32,
    overflowX: "auto",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)",
  },
  tableWrap: {
    minWidth: 700,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.92rem",
    fontFamily: "Inter, sans-serif"
  },
  th: {
    padding: "24px 16px",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 800,
    letterSpacing: "0.02em",
    verticalAlign: "bottom",
    background: "#f8fafc",
  },
  featureCol: {
    textAlign: "left",
    color: "#475569",
    width: "36%",
    paddingLeft: 24,
  },
  planCol: {
    textAlign: "center",
    color: "#002244",
    width: "16%",
  },
  badge: {
    display: "inline-block",
    background: "#f1f5f9",
    color: "#002244",
    border: "1px solid #cbd5e1",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: "0.65rem",
    fontWeight: 800,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  planName: {
    fontSize: "1.1rem",
    fontWeight: 900,
    color: "#002244",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: "1.4rem",
    fontWeight: 900,
    color: "#002244",
  },
  td: {
    padding: "16px",
    verticalAlign: "middle",
    borderBottom: "1px solid #f1f5f9",
  },
  rowEven: { background: "#ffffff" },
  rowOdd:  { background: "#f8fafc" },
  ctaRow:  { background: "#ffffff", borderTop: "2px solid #e2e8f0" },
  check: {
    color: "#16a34a",
    fontWeight: 900,
    fontSize: "1.1rem",
  },
  cross: {
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "1.05rem",
  },
  value: {
    color: "#002244",
    fontWeight: 700,
    fontSize: "0.88rem",
  },
  ctaBtn: {
    marginTop: 8,
    display: "inline-block",
    background: "#ffffff",
    color: "#002244",
    fontWeight: 800,
    borderRadius: 10,
    padding: "10px 16px",
    border: "2px solid #002244",
    cursor: "pointer",
    fontSize: "0.85rem",
    width: "calc(100% - 24px)",
    margin: "0 12px",
    transition: "all 0.2s",
  },
  ctaBtnPrimary: {
    background: "#002244",
    color: "#ffffff",
    border: "2px solid #002244",
  },
  ctaBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
};
