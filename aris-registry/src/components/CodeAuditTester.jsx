import { useState } from "react";
import { trackEvent } from "../utils/analytics";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function CodeAuditTester() {
  const [excerpt, setExcerpt] = useState("");
  const [language, setLanguage] = useState("python");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const endpoint = API_URL ? `${API_URL}/api/audit/code` : "/api/audit/code";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      trackEvent("code_audit_run_click", { language });
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excerpt, language }),
      });

      const data = await resp.json();
      setResult(data);
    } catch (err) {
      setError("Network or server error. Check console for details.");
      console.error("[CodeAuditTester] request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={styles.wrapper}>
      <h2 style={styles.title}>Code-Audit Playground (AlphaCode-style)</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div>
          <label htmlFor="rfpExcerpt" style={styles.label}>
            RFP excerpt (JSON or markdown)
          </label>
          <textarea
            id="rfpExcerpt"
            rows={6}
            required
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            style={styles.textarea}
            placeholder="Paste a small excerpt of the SAM.gov RFP here..."
          />
        </div>

        <div style={styles.row}>
          <label htmlFor="languagePicker" style={styles.label}>
            Target language
          </label>
          <select
            id="languagePicker"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            style={styles.select}
          >
            <option value="python">Python 3.11</option>
            <option value="node">Node 18 (JavaScript)</option>
          </select>
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Running..." : "Run Code-Audit"}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {result && (
        <div style={styles.resultCard}>
          <pre style={styles.resultPre}>
            {typeof result === "object" && !Array.isArray(result)
              ? JSON.stringify(result, null, 2)
              : String(result)}
          </pre>
        </div>
      )}
    </section>
  );
}

const styles = {
  wrapper: {
    maxWidth: 1080,
    margin: "20px auto 0",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
  },
  title: { margin: "0 0 14px", fontSize: "1.3rem", color: "#1f2937" },
  form: { display: "grid", gap: 12 },
  label: { display: "block", marginBottom: 6, color: "#475569", fontWeight: 600, fontSize: "0.9rem" },
  textarea: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    lineHeight: 1.5,
    padding: 12,
    resize: "vertical",
    color: "#0f172a",
    background: "#ffffff",
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  select: {
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    padding: "8px 10px",
    color: "#0f172a",
    background: "#ffffff",
  },
  button: {
    justifySelf: "start",
    borderRadius: 8,
    border: "1px solid #4338ca",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
    padding: "9px 14px",
    opacity: 1,
  },
  error: { marginTop: 10, color: "#dc2626", fontWeight: 600 },
  resultCard: {
    marginTop: 14,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: 12,
    overflowX: "auto",
  },
  resultPre: {
    margin: 0,
    color: "#1f2937",
    fontSize: 13,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
};
