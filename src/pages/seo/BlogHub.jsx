import { ArrowLeft } from "lucide-react";
import { BLOG_POSTS } from "../../content/blogManifest";

const s = {
  page: { minHeight: "100vh", background: "#0d0f14", color: "#e4e4e7", fontFamily: '"Inter", system-ui, sans-serif' },
  inner: { maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" },
  back: {
    display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
    background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: 600,
  },
  kicker: { fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#60a5fa", textTransform: "uppercase", marginBottom: 12 },
  h1: { fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 12 },
  lead: { fontSize: 16, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 40 },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 },
  link: {
    display: "block", padding: "20px 22px", borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
    color: "#f4f4f5", textDecoration: "none", transition: "border-color 0.15s ease, background 0.15s ease",
  },
  linkTitle: { fontSize: 17, fontWeight: 700, marginBottom: 8, lineHeight: 1.35 },
  linkDesc: { fontSize: 14, color: "#a1a1aa", lineHeight: 1.55 },
  cta: { marginTop: 48 },
  ctaBtn: {
    background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px",
    fontWeight: 700, fontSize: 15, cursor: "pointer",
  },
};

export default function BlogHub({ onBack, onEnterApp }) {
  return (
    <main style={s.page}>
      <div style={s.inner}>
        <button type="button" style={s.back} onClick={onBack}>
          <ArrowLeft size={16} aria-hidden /> Back to BidSmith
        </button>
        <p style={s.kicker}>BidSmith · Blog</p>
        <h1 style={s.h1}>Government contracting &amp; RFP insights</h1>
        <p style={s.lead}>
          Practical guides on bid/no-bid discipline, compliance matrices, and finding federal opportunities early.
        </p>
        <ul style={s.list}>
          {BLOG_POSTS.map((post) => (
            <li key={post.slug}>
              <a href={`/blog/${post.slug}`} style={s.link}>
                <div style={s.linkTitle}>{post.title}</div>
                <div style={s.linkDesc}>{post.description}</div>
              </a>
            </li>
          ))}
        </ul>
        <div style={s.cta}>
          <button type="button" style={s.ctaBtn} onClick={() => onEnterApp?.("blog_hub_cta")}>
            Start your free audit
          </button>
        </div>
      </div>
    </main>
  );
}
