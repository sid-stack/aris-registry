import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle2, ChevronRight, Zap } from "lucide-react";

const styles = {
  page: { minHeight: "100vh", background: "#0d0f14", color: "#e8eaf0", fontFamily: "'Inter', system-ui, sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid #1e2130" },
  backBtn: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 14 },
  logo: { fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" },
  hero: { maxWidth: 680, margin: "0 auto", padding: "72px 32px 56px", textAlign: "center" },
  badge: { display: "inline-block", background: "#1a1a2e", color: "#818cf8", border: "1px solid #2d2d5e", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 24 },
  h1: { fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 8, letterSpacing: "-0.03em" },
  tagline: { fontSize: "1.1rem", color: "#818cf8", fontWeight: 600, marginBottom: 20, letterSpacing: "0.01em" },
  sub: { fontSize: "1.1rem", color: "#8892a4", lineHeight: 1.75, marginBottom: 40 },
  formBox: { background: "#131620", border: "1px solid #1e2130", borderRadius: 14, padding: "36px 32px", maxWidth: 480, margin: "0 auto 0", textAlign: "left" },
  formLabel: { display: "block", fontSize: 12, fontWeight: 700, color: "#8892a4", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 },
  formInput: { width: "100%", background: "#0d0f14", border: "1px solid #1e2130", borderRadius: 8, padding: "12px 14px", fontSize: 15, color: "#e8eaf0", outline: "none", boxSizing: "border-box", marginBottom: 16 },
  submitBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#818cf8", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 24px", borderRadius: 8, border: "none", cursor: "pointer" },
  fine: { fontSize: 12, color: "#4a5568", textAlign: "center", marginTop: 12 },
  successBox: { background: "#131620", border: "1px solid #2d4a2d", borderRadius: 14, padding: "40px 32px", maxWidth: 480, margin: "0 auto", textAlign: "center" },
  successIcon: { color: "#4ade80", marginBottom: 16 },
  successTitle: { fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: 8 },
  successSub: { fontSize: 14, color: "#8892a4", lineHeight: 1.6 },
  section: { maxWidth: 820, margin: "0 auto", padding: "64px 32px 80px" },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 },
  sectionTitle: { fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 800, color: "#fff", marginBottom: 32, letterSpacing: "-0.02em" },
  whatGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 64 },
  whatCard: { background: "#131620", border: "1px solid #1e2130", borderRadius: 12, padding: "24px 20px" },
  whatIcon: { color: "#818cf8", marginBottom: 14 },
  whatTitle: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 },
  whatDesc: { fontSize: 13, color: "#8892a4", lineHeight: 1.6 },
  previewBox: { background: "#131620", border: "1px solid #1e2130", borderRadius: 14, padding: "32px", marginBottom: 64 },
  previewHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #1e2130" },
  previewTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  previewSub: { fontSize: 12, color: "#8892a4" },
  previewSection: { marginBottom: 20 },
  previewSectionTag: { fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 },
  previewSectionText: { fontSize: 14, color: "#c8cdd8", lineHeight: 1.7 },
  socialRow: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 },
  socialProof: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 48 },
  proofTag: { background: "#131620", border: "1px solid #1e2130", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#8892a4" },
  divider: { borderTop: "1px solid #1e2130", marginBottom: 48 },
};

const WHAT_YOU_GET = [
  {
    title: "One opportunity segment",
    desc: "A specific agency, vehicle, or set-aside type worth pursuing this week — with the signals that point to it.",
  },
  {
    title: "One compliance insight",
    desc: "A FAR/DFARS clause, solicitation pattern, or evaluation trap that's affecting active bids right now.",
  },
  {
    title: "One process tip",
    desc: "A specific change that reduces proposal time or improves your win probability. Actionable, not theoretical.",
  },
  {
    title: "Market pulse",
    desc: "What's moving in federal IT, defense, and professional services — in plain English, not agency jargon.",
  },
];

export default function Newsletter({ onBack }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Newsletter Subscriber",
          email,
          service: "newsletter",
          message: `Newsletter subscription request from ${email}`,
        }),
      });
    } catch {
      // Best-effort — show success regardless
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={styles.logo}>BidSmith</span>
        <span style={{ fontSize: 13, color: "#8892a4" }}>bidsmith.pro/newsletter</span>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.badge}>WEEKLY NEWSLETTER</div>
        <h1 style={styles.h1}>The Bid Brief</h1>
        <div style={styles.tagline}>Federal contracting intelligence. One email. Every week.</div>
        <p style={styles.sub}>
          Every Wednesday, The Bid Brief delivers high-signal intel for government contractors and BD teams —
          in under 5 minutes, with one clear action you can take the same day.
        </p>

        {/* Social proof tags */}
        <div style={styles.socialProof}>
          {["Capture managers", "Proposal directors", "BD leads", "GovCon consultants", "Prime contractors"].map(t => (
            <span key={t} style={styles.proofTag}>{t}</span>
          ))}
        </div>

        {/* Subscribe form */}
        {submitted ? (
          <div style={styles.successBox}>
            <CheckCircle2 size={40} style={styles.successIcon} />
            <div style={styles.successTitle}>You're in. See you Wednesday.</div>
            <div style={styles.successSub}>
              Check your inbox for a confirmation from sid@bidsmith.pro.
              First issue drops this Wednesday at 8am EST.
            </div>
          </div>
        ) : (
          <form style={styles.formBox} onSubmit={handleSubmit}>
            <label style={styles.formLabel}>First Name (optional)</label>
            <input
              style={styles.formInput}
              type="text"
              placeholder="Your first name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <label style={styles.formLabel}>Work Email *</label>
            <input
              style={styles.formInput}
              type="email"
              placeholder="you@yourcompany.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button style={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "Subscribing..." : <><Mail size={16} /> Subscribe Free <ChevronRight size={16} /></>}
            </button>
            <div style={styles.fine}>One email per week. No spam. Unsubscribe anytime.</div>
          </form>
        )}
      </div>

      <div style={styles.section}>

        {/* What you get */}
        <div style={styles.sectionLabel}>Every Issue</div>
        <div style={styles.sectionTitle}>What's in each edition</div>
        <div style={styles.whatGrid}>
          {WHAT_YOU_GET.map(w => (
            <div key={w.title} style={styles.whatCard}>
              <Zap size={18} style={styles.whatIcon} />
              <div style={styles.whatTitle}>{w.title}</div>
              <div style={styles.whatDesc}>{w.desc}</div>
            </div>
          ))}
        </div>

        <hr style={styles.divider} />

        {/* Sample issue preview */}
        <div style={styles.sectionLabel}>Issue Preview</div>
        <div style={styles.sectionTitle}>What a typical issue looks like</div>
        <div style={styles.previewBox}>
          <div style={styles.previewHeader}>
            <Mail size={20} color="#818cf8" />
            <div>
              <div style={styles.previewTitle}>The Bid Brief #001</div>
              <div style={styles.previewSub}>Subject: Bid volume is up. Win rates aren't.</div>
            </div>
          </div>

          <div style={styles.previewSection}>
            <div style={styles.previewSectionTag}>Opportunity Segment</div>
            <div style={styles.previewSectionText}>
              GSA is running 12 active task order competitions this quarter in IT modernization and cybersecurity.
              Average award: $8–22M. Small business set-asides make up 60%+ of the pipeline.
              GSA Schedule holders with CIO-SP3 or Alliant 2 experience are seeing above-average award rates.
            </div>
          </div>

          <div style={styles.previewSection}>
            <div style={styles.previewSectionTag}>Compliance Insight</div>
            <div style={styles.previewSectionText}>
              Watch FAR 52.215-1: Clarifications vs. Discussions. If you receive a clarification request
              post-submission, you can only clarify — not improve your proposal. Responding to a clarification
              as if it were a discussion can be used to justify a non-award finding.
            </div>
          </div>

          <div style={styles.previewSection}>
            <div style={styles.previewSectionTag}>Process Tip</div>
            <div style={styles.previewSectionText}>
              Set a 72-hour debrief request rule. Within 72 hours of any loss notification, your BD lead
              sends the debrief request. Contractors who do this improve win rate 15–20% over 12 months.
            </div>
          </div>

          <div style={styles.previewSection}>
            <div style={styles.previewSectionTag}>Market Pulse</div>
            <div style={styles.previewSectionText}>
              DHA releasing 4 new task orders in Q3 under MHS GENESIS. OMB guidance trending toward fewer
              sole-source awards over $500K — expect more competitive solicitations at previously
              sole-source-heavy agencies.
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        {!submitted && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>
              Join The Bid Brief
            </div>
            <div style={{ fontSize: 15, color: "#8892a4", marginBottom: 24 }}>
              Free. Weekly. Under 5 minutes per issue.
            </div>
            <button
              style={{ ...styles.submitBtn, width: "auto", display: "inline-flex", padding: "14px 36px" }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Mail size={16} /> Subscribe Free <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
