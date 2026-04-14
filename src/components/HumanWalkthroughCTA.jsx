/**
 * Post-audit Calendly CTA — shared by GovConDashboardV2 and BentoDashboard.
 * URL: VITE_CALENDLY_AUDIT_WALKTHROUGH, with a public fallback slug.
 */
import { useEffect } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { track, trackEvent } from "../utils/analytics";

const surfaceHi = "#f3f4f6";
const bg = "#ffffff";
const border = "#e5e7eb";
const accent = "#10a37f";
const navy = "#002244";
const text = "#0d0d0d";
const textMuted = "#374151";

const AUDIT_WALKTHROUGH_CALENDLY_URL =
  (typeof import.meta !== "undefined" && String(import.meta.env?.VITE_CALENDLY_AUDIT_WALKTHROUGH || "").trim())
  || "https://calendly.com/bidsmith-pro/audit-walkthrough";

export default function HumanWalkthroughCTA({ visible, solicitationId }) {
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
        background: `linear-gradient(180deg, ${surfaceHi} 0%, ${bg} 45%)`,
        borderTop: `1px solid ${border}`,
        boxShadow: "0 -6px 20px rgba(0,0,0,0.04)",
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
              background: "rgba(16,163,127,0.1)",
              border: "1px solid rgba(16,163,127,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={18} color={accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: text, letterSpacing: "-0.02em", marginBottom: 6 }}>
              Want a human walkthrough?
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: textMuted, lineHeight: 1.55 }}>
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
                background: navy,
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                border: `1px solid ${navy}`,
                boxShadow: "0 2px 8px rgba(0,34,68,0.2)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,34,68,0.28)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,34,68,0.2)";
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
