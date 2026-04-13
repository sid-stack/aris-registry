import { ArrowLeft, ArrowRight } from "lucide-react";
import { BOFU_RESOURCES } from "../../content/growthPlanData";
import { trackEvent } from "../../utils/analytics";

export function getGrowthResourceBySlug(slug) {
  return BOFU_RESOURCES.find((item) => item.slug === slug) || null;
}

export default function GrowthResourcePage({ slug, onBack, onEnterApp }) {
  const resource = getGrowthResourceBySlug(slug);

  if (!resource) {
    return (
      <main style={s.page}>
        <div style={s.wrap}>
          <button style={s.backButton} onClick={onBack}>
            <ArrowLeft size={14} /> Back to playbook
          </button>
          <h1 style={s.title}>Resource not found</h1>
          <p style={s.subtitle}>The requested growth resource does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <button style={s.backButton} onClick={onBack}>
          <ArrowLeft size={14} /> Back to resources
        </button>

        <p style={s.eyebrow}>BOFU RESOURCE</p>
        <h1 style={s.title}>{resource.title}</h1>
        <p style={s.subtitle}>{resource.description}</p>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Execution Steps</h2>
          <ul style={s.list}>
            {resource.sections.map((section) => <li key={section}>{section}</li>)}
          </ul>
        </section>

        <section style={s.ctaCard}>
          <h2 style={s.cardTitle}>Next Action</h2>
          <p style={s.subtitle}>{resource.cta}</p>
          <button
            style={s.ctaButton}
            onClick={() => {
              trackEvent("growth_resource_cta_clicked", { slug: resource.slug });
              onEnterApp?.();
            }}
          >
            Start free audit <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </main>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "28px 18px 42px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  wrap: { maxWidth: 900, margin: "0 auto" },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  eyebrow: {
    marginTop: 16,
    marginBottom: 10,
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
  },
  title: { margin: "0 0 8px", fontSize: "2rem" },
  subtitle: { margin: 0, color: "#475569", lineHeight: 1.6 },
  card: {
    marginTop: 16,
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#fff",
    padding: 16,
  },
  ctaCard: {
    marginTop: 14,
    border: "1px solid #dbeafe",
    borderRadius: 12,
    background: "#eff6ff",
    padding: 16,
  },
  cardTitle: { margin: "0 0 10px", fontSize: "1.1rem" },
  list: { margin: 0, paddingLeft: 20, display: "grid", gap: 8, lineHeight: 1.5 },
  ctaButton: {
    marginTop: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "none",
    background: "#1e3a8a",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
