import { trackEvent } from "../utils/analytics";

export default function Start({ onOpenLanding, onOpenTemplates, onOpenWorkspace }) {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <img src="/aris-logo.png" alt="Bidsmith logo" style={styles.logo} />
        <h1 style={styles.title}>Bidsmith Entry</h1>
        <p style={styles.subtitle}>
          Choose where you want to start: product landing, templates playground, or analyst workspace.
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => {
              trackEvent("start_open_landing_click", { source: "start_page" });
              onOpenLanding();
            }}
          >
            Open Landing Page
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              trackEvent("start_open_templates_click", { source: "start_page" });
              onOpenTemplates();
            }}
          >
            Open Templates + Code Audit
          </button>

          <button
            type="button"
            style={styles.ghostButton}
            onClick={() => {
              trackEvent("start_open_workspace_click", { source: "start_page" });
              onOpenWorkspace();
            }}
          >
            Open Analyst Workspace
          </button>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    background: "linear-gradient(145deg, #f8fafc 0%, #eef2ff 100%)",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "28px 22px",
    boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
    textAlign: "center",
  },
  logo: { width: 72, height: 72, display: "block", margin: "0 auto 12px" },
  title: { margin: 0, fontSize: "2rem", color: "#0f172a" },
  subtitle: { margin: "10px 0 18px", color: "#475569", lineHeight: 1.6 },
  actions: { display: "grid", gap: 10, maxWidth: 380, margin: "0 auto" },
  primaryButton: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #4338ca",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    fontWeight: 600,
    cursor: "pointer",
  },
  ghostButton: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px dashed #94a3b8",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 600,
    cursor: "pointer",
  },
};
