/**
 * Post-audit Calendly CTA — shared by GovConDashboardV2 and BentoDashboard.
 * URL: VITE_CALENDLY_AUDIT_WALKTHROUGH, with a public fallback slug.
 */
import { useEffect } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { track, trackEvent } from "../utils/analytics";
import { BD } from "../theme/bentoDarkTheme.js";

const LIGHT = {
  surfaceHi: "#f3f4f6",
  bg: "#fafafa",
  border: "#e5e7eb",
  accent: "#10a37f",
  navy: "#002244",
  text: "#0d0d0d",
  textMuted: "#374151",
  ctaLabel: "#f1f5f9",
};

const AUDIT_WALKTHROUGH_CALENDLY_URL =
  (typeof import.meta !== "undefined" && String(import.meta.env?.VITE_CALENDLY_AUDIT_WALKTHROUGH || "").trim())
  || "https://calendly.com/bidsmith-pro/audit-walkthrough";

/**
 * @param {{ visible: boolean, solicitationId?: string | null, variant?: 'light' | 'bento' }} props
 */
export default function HumanWalkthroughCTA({ visible, solicitationId, variant = "light" }) {
  const isBento = variant === "bento";
  const C = isBento
    ? {
        surfaceHi: BD.bgPanelHi,
        bg: BD.bgCard,
        border: BD.border,
        accent: BD.success,
        navy: BD.paywallCtaBg,
        text: BD.textBright,
        textMuted: BD.textSecondary,
        ctaLabel: BD.textBright,
      }
    : LIGHT;

  useEffect(() => {
    if (!visible) return;
    track("walkthrough_cta_shown", { trigger: "post_audit" });
  }, [visible]);

  if (!visible) return null;
  return (
    <div
      style={{
        flexShrink: 0,
        padding: "16px 20px 18px",
        background: isBento ? C.bg : `linear-gradient(180deg, ${C.surfaceHi} 0%, ${C.bg} 45%)`,
        borderTop: `1px solid ${C.border}`,
        boxShadow: isBento ? "0 -6px 20px rgba(0,0,0,0.35)" : "0 -6px 20px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              flexShrink: 0,
              background: isBento ? "rgba(74,222,128,0.12)" : "rgba(16,163,127,0.1)",
              border: isBento ? `1px solid ${BD.border}` : "1px solid rgba(16,163,127,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={18} color={C.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>
              Want a human walkthrough?
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: C.textMuted, lineHeight: 1.55 }}>
              {"We'll review your audit results together and tell you exactly where you're exposed — free, 20 minutes."}
            </p>
            <a
              href={AUDIT_WALKTHROUGH_CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("walkthrough_booked", { solicitation_id: solicitationId || null });
                trackEvent("audit_walkthrough_calendly_click", {
                  category: "conversion",
                  solicitation: solicitationId || null,
                });
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 20px",
                borderRadius: 10,
                background: C.navy,
                color: C.ctaLabel,
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                border: `1px solid ${isBento ? BD.borderHi : LIGHT.navy}`,
                boxShadow: isBento ? "0 2px 8px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,34,68,0.2)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = isBento
                  ? "0 4px 14px rgba(0,0,0,0.45)"
                  : "0 4px 14px rgba(0,34,68,0.28)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = isBento
                  ? "0 2px 8px rgba(0,0,0,0.35)"
                  : "0 2px 8px rgba(0,34,68,0.2)";
              }}
            >
              Book a call
              <ChevronRight size={16} style={{ opacity: 0.9 }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
