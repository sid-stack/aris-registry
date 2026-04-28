import { useEffect, useState } from "react";
import { adminAuthHeaders } from "../utils/adminAuthHeader";

/**
 * Admin-only outbound A/B snapshot (reads `ab_results` written by API scheduler).
 * @param {{ onUnauthorized?: () => void }} props
 */
export function OutboundAbPanel({ onUnauthorized } = {}) {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/ab-results", { headers: adminAuthHeaders() });
        const data = await res.json();
        if (res.status === 401) {
          onUnauthorized?.();
          return;
        }
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) {
          setResults(data.variants || []);
          setSummary(data.summary || null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onUnauthorized]);

  if (loading) {
    return <p style={{ color: "#94a3b8", margin: 0 }}>Loading outbound A/B…</p>;
  }
  if (error) {
    return <p style={{ color: "#f87171", margin: 0 }}>{error}</p>;
  }

  return (
    <div style={{ padding: 24, background: "#0f172a", borderRadius: 12, color: "#f1f5f9" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Outbound A/B results
      </h2>

      {summary && (
        <div style={{ marginBottom: 16, padding: 12, background: "#1e293b", borderRadius: 8 }}>
          <strong>Total sent:</strong>{" "}
          {summary.total_sent != null ? Number(summary.total_sent) : "—"}
          {" "}|{" "}
          <strong>Avg open rate:</strong>{" "}
          {summary.avg_open_rate != null ? `${summary.avg_open_rate}%` : "—"}
          {" "}|{" "}
          <strong>Avg reply rate:</strong>{" "}
          {summary.avg_reply_rate != null ? `${summary.avg_reply_rate}%` : "—"}
          {" "}|{" "}
          <strong>Converted:</strong>{" "}
          {summary.total_converted != null ? Number(summary.total_converted) : "—"}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ color: "#94a3b8", textAlign: "left" }}>
            <th style={{ padding: "8px 12px" }}>Test</th>
            <th style={{ padding: "8px 12px" }}>Variant</th>
            <th style={{ padding: "8px 12px" }}>Sent</th>
            <th style={{ padding: "8px 12px" }}>Opens</th>
            <th style={{ padding: "8px 12px" }}>Replies</th>
            <th style={{ padding: "8px 12px" }}>Converted</th>
            <th style={{ padding: "8px 12px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr
              key={`${r.test_name}-${r.variant_key}-${r.id}`}
              style={{
                borderTop: "1px solid #1e293b",
                background: r.winner ? "#14532d22" : "transparent",
              }}
            >
              <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{r.test_name}</td>
              <td style={{ padding: "8px 12px", fontWeight: 700 }}>Variant {r.variant_key}</td>
              <td style={{ padding: "8px 12px" }}>{r.sent_count}</td>
              <td style={{ padding: "8px 12px" }}>{r.open_rate != null ? `${r.open_rate}%` : "—"}</td>
              <td
                style={{
                  padding: "8px 12px",
                  color: Number(r.reply_rate) > 5 ? "#4ade80" : "#f1f5f9",
                }}
              >
                {r.reply_rate != null ? `${r.reply_rate}%` : "—"}
              </td>
              <td style={{ padding: "8px 12px" }}>{r.paid_count}</td>
              <td style={{ padding: "8px 12px" }}>
                {r.winner ? (
                  <span style={{ color: "#4ade80", fontWeight: 700 }}>Winner</span>
                ) : Number(r.sent_count) < 20 ? (
                  <span style={{ color: "#94a3b8" }}>Collecting…</span>
                ) : (
                  <span style={{ color: "#f59e0b" }}>Testing</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!results.length && (
        <p style={{ color: "#94a3b8", marginTop: 16 }}>
          No rollup rows yet. After Apollo pull + Instantly send + 07:45 A/B job, results appear here.
        </p>
      )}
    </div>
  );
}
