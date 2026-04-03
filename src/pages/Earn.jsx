import { ArrowLeft, DollarSign, Link2, Users, TrendingUp, CheckCircle2, ChevronRight } from "lucide-react";

const styles = {
  page: { minHeight: "100vh", background: "#0d0f14", color: "#e8eaf0", fontFamily: "'Inter', system-ui, sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid #1e2130" },
  backBtn: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 14 },
  logo: { fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" },
  hero: { maxWidth: 760, margin: "0 auto", padding: "72px 32px 48px", textAlign: "center" },
  badge: { display: "inline-block", background: "#1a2a1a", color: "#4ade80", border: "1px solid #2d4a2d", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 24 },
  h1: { fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.03em" },
  sub: { fontSize: "1.15rem", color: "#8892a4", lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" },
  ctaBtn: { display: "inline-flex", alignItems: "center", gap: 8, background: "#4ade80", color: "#0a0f0a", fontWeight: 700, fontSize: 15, padding: "14px 32px", borderRadius: 8, border: "none", cursor: "pointer", textDecoration: "none" },
  section: { maxWidth: 900, margin: "0 auto", padding: "0 32px 80px" },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginTop: 48, marginBottom: 64 },
  stepCard: { background: "#131620", border: "1px solid #1e2130", borderRadius: 12, padding: "28px 24px" },
  stepNum: { width: 36, height: 36, borderRadius: "50%", background: "#4ade8020", border: "1px solid #4ade8040", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#4ade80", marginBottom: 16 },
  stepTitle: { fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 },
  stepDesc: { fontSize: 14, color: "#8892a4", lineHeight: 1.6 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 },
  sectionTitle: { fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-0.02em" },
  sectionBody: { fontSize: 15, color: "#8892a4", lineHeight: 1.7 },
  earningsBox: { background: "#131620", border: "1px solid #1e2130", borderRadius: 16, padding: "40px 32px", marginBottom: 64, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32 },
  earningItem: { textAlign: "center" },
  earningVal: { fontSize: "2.4rem", fontWeight: 900, color: "#4ade80", lineHeight: 1, marginBottom: 8 },
  earningLabel: { fontSize: 13, color: "#8892a4", lineHeight: 1.5 },
  plansTable: { width: "100%", borderCollapse: "collapse", marginTop: 24, marginBottom: 64 },
  th: { textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#8892a4", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid #1e2130" },
  td: { padding: "16px", fontSize: 14, color: "#e8eaf0", borderBottom: "1px solid #0d0f14" },
  tdGreen: { padding: "16px", fontSize: 15, fontWeight: 700, color: "#4ade80", borderBottom: "1px solid #0d0f14" },
  trAlt: { background: "#131620" },
  whoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 24, marginBottom: 64 },
  whoCard: { background: "#131620", border: "1px solid #1e2130", borderRadius: 10, padding: "20px 18px", display: "flex", alignItems: "flex-start", gap: 12 },
  whoCheck: { color: "#4ade80", flexShrink: 0, marginTop: 2 },
  whoText: { fontSize: 14, color: "#e8eaf0", lineHeight: 1.5 },
  faqList: { display: "flex", flexDirection: "column", gap: 16, marginTop: 24, marginBottom: 64 },
  faqItem: { background: "#131620", border: "1px solid #1e2130", borderRadius: 10, padding: "20px 24px" },
  faqQ: { fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 },
  faqA: { fontSize: 14, color: "#8892a4", lineHeight: 1.6 },
  bottomCta: { background: "#131620", border: "1px solid #1e2130", borderRadius: 16, padding: "48px 32px", textAlign: "center", marginBottom: 64 },
  bottomCtaTitle: { fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" },
  bottomCtaSub: { fontSize: 15, color: "#8892a4", marginBottom: 32 },
  divider: { borderTop: "1px solid #1e2130", marginBottom: 48, marginTop: 0 },
};

const WHO_TYPES = [
  "GovCon consultants & capture managers",
  "Proposal writers with multiple clients",
  "PTAC & SBDC advisors",
  "RFP training course creators",
  "LinkedIn GovCon creators",
  "NCMA & AFCEA chapter leaders",
  "Attorneys & accountants serving contractors",
  "SBA resource partners",
];

const FAQS = [
  { q: "When do I get paid?", a: "Monthly, on the 15th, for all conversions in the prior month." },
  { q: "Is there a minimum payout?", a: "$50 minimum. Earnings below $50 roll over to the next month." },
  { q: "How long does the tracking window last?", a: "90 days from the first click on your referral link." },
  { q: "What if my referral cancels?", a: "Commission stops when the referred customer cancels their paid plan. Recurring commissions continue as long as they're active." },
  { q: "Is there a cap on earnings?", a: "No cap. Refer 50 teams, earn on all 50 — every month." },
  { q: "Do I need to be a BidSmith customer?", a: "No. You can become a partner without having a paid subscription yourself." },
];

export default function Earn({ onBack }) {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={styles.logo}>BidSmith</span>
        <span style={{ fontSize: 13, color: "#8892a4" }}>bidsmith.pro/earn</span>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.badge}>PARTNER PROGRAM</div>
        <h1 style={styles.h1}>Earn with BidSmith</h1>
        <p style={styles.sub}>
          Refer federal contractors to BidSmith. Earn 20% on every paid conversion — recurring, no cap, no ceiling.
        </p>
        <a href="mailto:sid@bidsmith.pro?subject=Partner Program" style={styles.ctaBtn}>
          Get My Referral Link <ChevronRight size={16} />
        </a>
      </div>

      <div style={styles.section}>

        {/* Earnings snapshot */}
        <div style={styles.earningsBox}>
          <div style={styles.earningItem}>
            <div style={styles.earningVal}>20%</div>
            <div style={styles.earningLabel}>Recurring commission on every paid plan</div>
          </div>
          <div style={styles.earningItem}>
            <div style={styles.earningVal}>90d</div>
            <div style={styles.earningLabel}>Attribution window from first click</div>
          </div>
          <div style={styles.earningItem}>
            <div style={styles.earningVal}>$0</div>
            <div style={styles.earningLabel}>No integration, no selling — just share your link</div>
          </div>
          <div style={styles.earningItem}>
            <div style={styles.earningVal}>∞</div>
            <div style={styles.earningLabel}>No cap on referrals or total earnings</div>
          </div>
        </div>

        {/* How it works */}
        <div style={styles.sectionLabel}>How It Works</div>
        <div style={styles.sectionTitle}>Three steps to start earning</div>
        <div style={styles.stepsGrid}>
          {[
            { n: "1", icon: <Link2 size={18} />, title: "Get your link", desc: "Sign up and get a unique referral link in 60 seconds. No setup, no integration required." },
            { n: "2", icon: <Users size={18} />, title: "Share it", desc: "Send your link to anyone in federal contracting — clients, colleagues, your audience, your newsletter." },
            { n: "3", icon: <DollarSign size={18} />, title: "Earn", desc: "When they upgrade to a paid plan, you earn 20% every month they stay. No follow-up needed." },
          ].map(s => (
            <div key={s.n} style={styles.stepCard}>
              <div style={styles.stepNum}>{s.n}</div>
              <div style={styles.stepTitle}>{s.title}</div>
              <div style={styles.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>

        <hr style={styles.divider} />

        {/* Commission table */}
        <div style={styles.sectionLabel}>Commission Structure</div>
        <div style={styles.sectionTitle}>What you earn per referral</div>
        <table style={styles.plansTable}>
          <thead>
            <tr>
              <th style={styles.th}>Plan</th>
              <th style={styles.th}>Monthly Value</th>
              <th style={styles.th}>Your Commission</th>
              <th style={styles.th}>Per Year (if retained)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Starter</td>
              <td style={styles.td}>$99 / mo</td>
              <td style={styles.tdGreen}>$19.80 / mo</td>
              <td style={styles.td}>$237.60</td>
            </tr>
            <tr style={styles.trAlt}>
              <td style={styles.td}>Pro</td>
              <td style={styles.td}>$299 / mo</td>
              <td style={styles.tdGreen}>$59.80 / mo</td>
              <td style={styles.td}>$717.60</td>
            </tr>
            <tr>
              <td style={styles.td}>Enterprise</td>
              <td style={styles.td}>$999 / mo</td>
              <td style={styles.tdGreen}>$199.80 / mo</td>
              <td style={styles.td}>$2,397.60</td>
            </tr>
          </tbody>
        </table>

        <hr style={styles.divider} />

        {/* Who it's for */}
        <div style={styles.sectionLabel}>Who It's For</div>
        <div style={styles.sectionTitle}>Built for people in the GovCon ecosystem</div>
        <div style={styles.whoGrid}>
          {WHO_TYPES.map(w => (
            <div key={w} style={styles.whoCard}>
              <CheckCircle2 size={16} style={styles.whoCheck} />
              <span style={styles.whoText}>{w}</span>
            </div>
          ))}
        </div>

        <hr style={styles.divider} />

        {/* FAQ */}
        <div style={styles.sectionLabel}>FAQ</div>
        <div style={styles.sectionTitle}>Common questions</div>
        <div style={styles.faqList}>
          {FAQS.map(f => (
            <div key={f.q} style={styles.faqItem}>
              <div style={styles.faqQ}>{f.q}</div>
              <div style={styles.faqA}>{f.a}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={styles.bottomCta}>
          <TrendingUp size={32} color="#4ade80" style={{ marginBottom: 16 }} />
          <div style={styles.bottomCtaTitle}>Ready to start earning?</div>
          <div style={styles.bottomCtaSub}>
            Email sid@bidsmith.pro with "Partner Program" in the subject. We'll send your unique link within 24 hours.
          </div>
          <a href="mailto:sid@bidsmith.pro?subject=Partner Program — Referral Link Request" style={styles.ctaBtn}>
            Get My Referral Link <ChevronRight size={16} />
          </a>
        </div>

      </div>
    </div>
  );
}
