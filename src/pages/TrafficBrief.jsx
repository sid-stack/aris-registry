import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";

function MetricCard({ label, value, help }) {
  return (
    <div style={s.metricCard}>
      <div style={s.metricLabel}>{label}</div>
      <div style={s.metricValue}>{value}</div>
      <div style={s.metricHelp}>{help}</div>
    </div>
  );
}

export default function TrafficBrief({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBrief = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/traffic-brief");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message || "Failed to load traffic brief.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, []);

  const summary = data?.summary || {};
  const trend = useMemo(() => data?.trend_7d || [], [data]);
  const topPages = useMemo(() => data?.top_pages_yesterday || [], [data]);

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <header style={s.header}>
          <button style={s.backButton} onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </button>
          <button style={s.refreshButton} onClick={fetchBrief} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <h1 style={s.title}>Morning Traffic Brief</h1>
        <p style={s.subtitle}>
          Daily KPI snapshot you can check every morning. URL: <code>/traffic-brief</code>
        </p>

        {error && <div style={s.error}>{error}</div>}

        <section style={s.metricsGrid}>
          <MetricCard label="Yesterday Visitors" value={summary.visitors_yesterday ?? 0} help="Unique tracked users on page_view." />
          <MetricCard label="Yesterday Pageviews" value={summary.pageviews_yesterday ?? 0} help="Total page_view events." />
          <MetricCard label="Qualified Sessions" value={summary.qualified_yesterday ?? 0} help="High-intent sessions from BOFU pages." />
          <MetricCard label="Audits Started" value={summary.audits_yesterday ?? 0} help="Users who initiated audit flow." />
          <MetricCard label="Qualified → Audit %" value={`${summary.qualified_to_audit_rate_pct ?? 0}%`} help="Conversion from qualified sessions to audit start." />
          <MetricCard label="7d Visitors" value={summary.visitors_7d ?? 0} help="Rolling seven-day unique visitors." />
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Top Pages (Yesterday)</h2>
          {topPages.length === 0 ? (
            <p style={s.empty}>No pageview data for yesterday yet.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Path</th>
                  <th style={s.th}>Pageviews</th>
                  <th style={s.th}>Visitors</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((row) => (
                  <tr key={row.path}>
                    <td style={s.td}>{row.path}</td>
                    <td style={s.td}>{row.pageviews}</td>
                    <td style={s.td}>{row.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>7-Day Trend</h2>
          {trend.length === 0 ? (
            <p style={s.empty}>No trend data yet.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Day</th>
                  <th style={s.th}>Visitors</th>
                  <th style={s.th}>Pageviews</th>
                  <th style={s.th}>Qualified</th>
                  <th style={s.th}>Audits</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((row) => (
                  <tr key={row.day}>
                    <td style={s.td}>{row.day}</td>
                    <td style={s.td}>{row.visitors}</td>
                    <td style={s.td}>{row.pageviews}</td>
                    <td style={s.td}>{row.qualified}</td>
                    <td style={s.td}>{row.audits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <p style={s.generated}>
          Last generated: {data?.generated_at ? new Date(data.generated_at).toLocaleString() : "—"}
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "24px 16px 36px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  wrap: { maxWidth: 1100, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 12 },
  backButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    padding: "8px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
    cursor: "pointer",
  },
  refreshButton: {
    border: "1px solid #0f172a",
    borderRadius: 8,
    background: "#0f172a",
    color: "#fff",
    padding: "8px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
    cursor: "pointer",
  },
  title: { margin: "14px 0 8px", fontSize: "2rem" },
  subtitle: { margin: 0, color: "#475569" },
  error: { marginTop: 14, background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, padding: 10 },
  metricsGrid: {
    marginTop: 14,
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  },
  metricCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    background: "#fff",
    padding: 12,
  },
  metricLabel: { fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" },
  metricValue: { fontSize: "1.8rem", fontWeight: 900, marginTop: 6 },
  metricHelp: { marginTop: 6, fontSize: 12, color: "#64748b" },
  card: {
    marginTop: 14,
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    background: "#fff",
    padding: 12,
  },
  cardTitle: { margin: "0 0 10px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    padding: "8px 6px",
    borderBottom: "1px solid #e2e8f0",
  },
  td: { padding: "9px 6px", borderBottom: "1px solid #f1f5f9", fontSize: 13 },
  empty: { margin: 0, color: "#64748b", fontSize: 13 },
  generated: { marginTop: 12, color: "#64748b", fontSize: 12 },
};
