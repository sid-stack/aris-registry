/**
 * Side-by-side plan comparison table with ✓ / ✗ per feature per tier.
 * Replaces the legacy card grid in Landing.jsx#pricing.
 */
import { GTM_PRICING_PLANS, STRIPE_PAYMENT_LINKS } from "../lib/pricing";

const CHECK = "✓";
const CROSS  = "✗";

/** [label, free, starter, standard, enterprise] */
const FEATURES = [
  ["Audits per month",              "3",          "10",         "Unlimited",  "Unlimited"],
  ["Compliance matrix",             CHECK,        CHECK,        CHECK,        CHECK],
  ["FAR / DFARS clause extraction", CHECK,        CHECK,        CHECK,        CHECK],
  ["Risk score",                    CROSS,        CHECK,        CHECK,        CHECK],
  ["Bid / no-bid recommendation",   CROSS,        CHECK,        CHECK,        CHECK],
  ["Full report download (CSV)",    CROSS,        CHECK,        CHECK,        CHECK],
  ["Real-time streaming analysis",  CROSS,        CROSS,        CHECK,        CHECK],
  ["Deep competitive shred",        CROSS,        CROSS,        CROSS,        CHECK],
  ["Capture strategy",              CROSS,        CROSS,        CROSS,        CHECK],
  ["Win themes",                    CROSS,        CROSS,        CROSS,        CHECK],
  ["Priority support",              CROSS,        CROSS,        CROSS,        CHECK],
];

const PLAN_KEYS = ["free", "starter", "standard", "enterprise"];

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
            {FEATURES.map(([label, free, starter, standard, enterprise], i) => {
              const vals = [free, starter, standard, enterprise];
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
  },
  tableWrap: {
    minWidth: 640,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.92rem",
  },
  th: {
    padding: "14px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 700,
    letterSpacing: "0.02em",
    verticalAlign: "bottom",
    background: "rgba(255,255,255,0.03)",
  },
  featureCol: {
    textAlign: "left",
    color: "#a1a1aa",
    width: "36%",
    paddingLeft: 16,
  },
  planCol: {
    textAlign: "center",
    color: "#f4f4f5",
    width: "16%",
  },
  badge: {
    display: "inline-block",
    background: "rgba(59,130,246,0.18)",
    color: "#60a5fa",
    border: "1px solid rgba(59,130,246,0.35)",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  planName: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#f4f4f5",
    marginBottom: 2,
  },
  planPrice: {
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "#818cf8",
  },
  td: {
    padding: "11px 12px",
    verticalAlign: "middle",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  rowEven: { background: "rgba(255,255,255,0.01)" },
  rowOdd:  { background: "transparent" },
  ctaRow:  { background: "transparent" },
  check: {
    color: "#34d399",
    fontWeight: 700,
    fontSize: "1.1rem",
  },
  cross: {
    color: "#52525b",
    fontWeight: 600,
    fontSize: "1.05rem",
  },
  value: {
    color: "#a5b4fc",
    fontWeight: 600,
    fontSize: "0.88rem",
  },
  ctaBtn: {
    marginTop: 6,
    display: "inline-block",
    background: "rgba(79,70,229,0.15)",
    color: "#a5b4fc",
    fontWeight: 600,
    borderRadius: 8,
    padding: "8px 14px",
    border: "1px solid rgba(79,70,229,0.4)",
    cursor: "pointer",
    fontSize: "0.82rem",
    width: "100%",
    transition: "background 0.15s",
  },
  ctaBtnPrimary: {
    background: "#4f46e5",
    color: "#ffffff",
    border: "1px solid #4338ca",
  },
  ctaBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
};
