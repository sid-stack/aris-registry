import { useState } from "react";
import { useArisDiscover } from "../hooks/useArisDiscover";
import { trackEvent } from "../utils/analytics";

export default function DiscoverAgent() {
  const [capability, setCapability] = useState("");
  const { discover, loading, result, error } = useArisDiscover();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = capability.trim();
    if (!value) return;
    trackEvent("aris_discover_click", { source: "templates_page" });
    await discover(value);
  };

  return (
    <section style={styles.wrapper}>
      <h2 style={styles.title}>Find the Best Agent for a Capability</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="e.g. media.transcode.ffmpeg"
          value={capability}
          onChange={(event) => setCapability(event.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Searching..." : "Discover"}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {result && (
        <div style={styles.result}>
          <p style={styles.resultRow}>
            <strong>Agent URL:</strong> <code>{result.agentUrl}</code>
          </p>
          <p style={styles.resultRow}>
            <strong>Latency:</strong> {result.latencyMs} ms
          </p>
          <p style={styles.resultRow}>
            <strong>Uptime:</strong> {Number(result.uptimePct || 0).toFixed(1)}%
          </p>
          <p style={styles.resultRow}>
            <strong>Price:</strong> INR {result.priceInr}
          </p>
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
  title: { margin: "0 0 14px", fontSize: "1.25rem", color: "#1f2937" },
  form: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: {
    flex: 1,
    minWidth: 260,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    color: "#0f172a",
  },
  button: {
    border: "1px solid #4338ca",
    borderRadius: 8,
    padding: "10px 14px",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { marginTop: 10, color: "#dc2626", fontWeight: 600 },
  result: {
    marginTop: 14,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: 12,
  },
  resultRow: { margin: "0 0 6px", color: "#334155", fontSize: 14 },
};
