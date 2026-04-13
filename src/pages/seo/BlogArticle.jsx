import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getBlogPost } from "../../content/blogManifest";

export default function BlogArticle({ slug, onBack, onEnterApp }) {
  const meta = getBlogPost(slug);
  const [md, setMd] = useState("");
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    setErr(null);
    setMd("");
    fetch(`/content/${meta.file}`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load article");
        return r.text();
      })
      .then((t) => {
        if (!cancelled) setMd(stripFrontMatterLines(t));
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message || "Failed to load");
      });
    return () => { cancelled = true; };
  }, [meta]);

  if (!meta) {
    return (
      <main style={s.page}>
        <div style={s.inner}>
          <button type="button" style={s.back} onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={s.h1}>Article not found</h1>
          <p style={s.lead}>This blog post does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.inner}>
        <button type="button" style={s.back} onClick={onBack}>
          <ArrowLeft size={16} /> Back to BidSmith
        </button>
        <article>
          <p style={s.kicker}>BidSmith · GovCon</p>
          <h1 style={s.h1}>{meta.title}</h1>
          <p style={s.lead}>{meta.description}</p>
          <div style={s.divider} />

          {err && <p style={s.error}>{err}</p>}
          {!err && !md && (
            <p style={s.loading}>
              <Loader2 size={18} style={{ animation: "bs-spin 0.8s linear infinite", verticalAlign: "middle", marginRight: 8 }} />
              Loading…
            </p>
          )}
          {md && (
            <div className="blog-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
            </div>
          )}

          <section style={s.cta}>
            <h2 style={s.h2}>Run your next solicitation through BidSmith</h2>
            <p style={s.ctaText}>
              Paste a SAM.gov URL or upload a PDF — compliance matrix, FAR/DFARS risk flags, and bid/no-bid rationale in about 90 seconds.
            </p>
            <button type="button" style={s.ctaBtn} onClick={() => onEnterApp?.("blog_footer_cta")}>
              Start free audit
            </button>
          </section>
        </article>
        <style>{`
          @keyframes bs-spin { to { transform: rotate(360deg); } }
          .blog-md { color: #1e293b; font-size: 1.05rem; line-height: 1.75; max-width: 720px; }
          .blog-md h1, .blog-md h2, .blog-md h3 { color: #0f172a; margin-top: 1.75em; margin-bottom: 0.5em; line-height: 1.3; }
          .blog-md h1 { font-size: 1.75rem; }
          .blog-md h2 { font-size: 1.35rem; }
          .blog-md h3 { font-size: 1.15rem; }
          .blog-md p { margin: 0 0 1em; }
          .blog-md ul, .blog-md ol { margin: 0 0 1em 1.25em; padding: 0; }
          .blog-md li { margin-bottom: 0.35em; }
          .blog-md a { color: #1d4ed8; font-weight: 600; }
          .blog-md code { background: #f1f5f9; padding: 0.12em 0.35em; border-radius: 4px; font-size: 0.9em; }
          .blog-md pre { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 10px; overflow-x: auto; font-size: 0.88rem; }
          .blog-md blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding-left: 1em; color: #475569; }
          .blog-md hr { border: none; border-top: 1px solid #e2e8f0; margin: 2em 0; }
        `}</style>
      </div>
    </main>
  );
}

/** Remove optional **Target keyword:** / **Publish:** lines after title for cleaner reading. */
function stripFrontMatterLines(src) {
  const lines = src.split("\n");
  const out = [];
  let i = 0;
  if (lines[0]?.startsWith("# ")) {
    out.push(lines[0]);
    i = 1;
    while (i < lines.length && lines[i].trim() === "") i++;
    while (i < lines.length && /^\*\*(Target keyword|Publish):\*\*/i.test(lines[i].trim())) {
      i++;
      while (i < lines.length && lines[i].trim() === "") i++;
    }
    out.push("", ...lines.slice(i));
    return out.join("\n").trim();
  }
  return src;
}

const s = {
  page: { minHeight: "100vh", background: "#fff", padding: "28px 18px 56px", fontFamily: "Inter, system-ui, sans-serif" },
  inner: { maxWidth: 760, margin: "0 auto" },
  back: {
    display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
    border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px",
    background: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#334155",
  },
  kicker: { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", margin: "0 0 8px" },
  h1: { fontSize: "clamp(1.65rem, 4vw, 2.15rem)", lineHeight: 1.2, color: "#0f172a", margin: "0 0 12px" },
  lead: { fontSize: "1.1rem", color: "#475569", lineHeight: 1.65, margin: 0 },
  divider: { height: 1, background: "#e2e8f0", margin: "28px 0" },
  loading: { color: "#64748b", display: "flex", alignItems: "center", gap: 8 },
  error: { color: "#b91c1c", fontWeight: 600 },
  cta: {
    marginTop: 48, padding: 24, borderRadius: 14, background: "linear-gradient(135deg, #f0f9ff 0%, #eef2ff 100%)",
    border: "1px solid #bfdbfe",
  },
  h2: { margin: "0 0 10px", fontSize: "1.2rem", color: "#0f172a" },
  ctaText: { margin: "0 0 16px", color: "#475569", lineHeight: 1.6, fontSize: "0.98rem" },
  ctaBtn: {
    display: "inline-block", padding: "12px 22px", borderRadius: 10, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: 15, color: "#fff", background: "#002244",
  },
};
