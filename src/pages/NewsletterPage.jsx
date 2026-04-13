import { ArrowLeft, Mail } from "lucide-react";
import { trackEvent } from "../utils/analytics";

const s = {
  page: { minHeight: "100vh", background: "#0d0f14", color: "#e4e4e7", fontFamily: '"Inter", system-ui, sans-serif' },
  inner: { maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" },
  back: {
    display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
    background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: 600,
  },
  kicker: { fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#60a5fa", textTransform: "uppercase", marginBottom: 12 },
  h1: { fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 16 },
  lead: { fontSize: 16, color: "#a1a1aa", lineHeight: 1.65, marginBottom: 28 },
  list: { margin: "0 0 28px", paddingLeft: 20, color: "#cbd5e1", fontSize: 15, lineHeight: 1.7 },
  embedWrap: {
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.02)",
    minHeight: 320,
    marginBottom: 24,
  },
  iframe: { width: "100%", height: 520, border: "none", display: "block" },
  btn: {
    display: "inline-flex", alignItems: "center", gap: 10,
    background: "#2563eb", color: "#fff", border: "none", borderRadius: 10,
    padding: "14px 24px", fontWeight: 700, fontSize: 15, cursor: "pointer", textDecoration: "none",
  },
  fine: { fontSize: 13, color: "#64748b", marginTop: 20, lineHeight: 1.55 },
  devBox: {
    marginTop: 24, padding: 16, borderRadius: 10,
    background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#fcd34d", fontSize: 13, lineHeight: 1.55,
  },
};

/** Hosted newsletter (Beehiiv, ConvertKit, etc.) — URLs from Vite env at build time. */
export default function NewsletterPage({ onBack }) {
  const embedSrc = (import.meta.env.VITE_NEWSLETTER_EMBED_SRC || "").trim();
  const signupUrl = (import.meta.env.VITE_NEWSLETTER_SIGNUP_URL || "").trim();
  const configured = Boolean(embedSrc || signupUrl);

  const openSignup = () => {
    if (!signupUrl) return;
    trackEvent("newsletter_outbound_click", { destination: "hosted_signup" });
    window.open(signupUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main style={s.page}>
      <div style={s.inner}>
        <button type="button" style={s.back} onClick={onBack}>
          <ArrowLeft size={16} aria-hidden /> Back to BidSmith
        </button>
        <p style={s.kicker}>The Bid Brief</p>
        <h1 style={s.h1}>Federal RFP intel — short, actionable, in your inbox</h1>
        <p style={s.lead}>
          Twice a week: one read on bid/no-bid discipline, compliance traps, or pipeline focus — built for small GovCon and capture teams. No custom signup code here; we use a hosted provider so subscribe, deliver, and compliance stay simple.
        </p>
        <ul style={s.list}>
          <li>One opportunity lens or agency pulse you can use the same day</li>
          <li>One FAR / solicitation pattern worth a second look before you staff</li>
          <li>One workflow note (SAM.gov, matrices, reviews)</li>
        </ul>

        {embedSrc ? (
          <div style={s.embedWrap}>
            <iframe
              title="Subscribe to The Bid Brief"
              src={embedSrc}
              style={s.iframe}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        ) : null}

        {signupUrl ? (
          <div>
            <button type="button" style={s.btn} onClick={openSignup}>
              <Mail size={18} aria-hidden />
              Subscribe (hosted form)
            </button>
            <p style={s.fine}>
              Opens our newsletter provider in a new tab — unsubscribes and preferences are handled there.
            </p>
          </div>
        ) : null}

        {!configured && import.meta.env.DEV ? (
          <div style={s.devBox}>
            <strong>Dev:</strong> set <code style={{ color: "#fde68a" }}>VITE_NEWSLETTER_SIGNUP_URL</code> and/or{" "}
            <code style={{ color: "#fde68a" }}>VITE_NEWSLETTER_EMBED_SRC</code> in{" "}
            <code style={{ color: "#fde68a" }}>.env.local</code>. See <code style={{ color: "#fde68a" }}>docs/NEWSLETTER_TOOL_SETUP.md</code>.
          </div>
        ) : null}

        {!configured && !import.meta.env.DEV ? (
          <p style={{ ...s.fine, color: "#94a3b8" }}>
            Subscription form is being connected. Email{" "}
            <a href="mailto:sid@bidsmith.pro" style={{ color: "#93c5fd" }}>sid@bidsmith.pro</a>{" "}
            with subject &quot;Bid Brief&quot; to get on the list meanwhile.
          </p>
        ) : null}
      </div>
    </main>
  );
}
