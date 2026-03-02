export default function Proposal({ proposal, onReset }) {
  const { document_metadata: meta, submission_details: sub, evaluation_summary: evalSum, compliance_summary: comp, requirements, gaps, far_clauses_detected, confidence_metrics } = proposal;
  const scoreColor = comp.bid_score >= 75 ? "#2dd4a0" : comp.bid_score >= 50 ? "#f5a623" : "#ff5f5f";
  const riskIcon   = l => ({ High: "❌", Medium: "⚠️", Low: "✅", "Review Required": "🔍" }[l] || "–");
  const riskColor  = l => ({ High: "#ff5f5f", Medium: "#f5a623", Low: "#2dd4a0", "Review Required": "#4a7cff" }[l] || "#888");
  const th = { padding: "9px 12px", textAlign: "left", border: "1px solid #1e2330", color: "#6b7585", fontWeight: 500, fontSize: 12, whiteSpace: "nowrap" };
  const td = { padding: "9px 12px", border: "1px solid #1e2330", fontSize: 13, lineHeight: 1.5, verticalAlign: "top" };
  function Card({ label, value, color = "#d4d8e2", note }) {
    return (
      <div style={{ background: "#13161e", border: "1px solid #252932", borderRadius: 8, padding: "16px 18px" }}>
        <div style={{ fontSize: 10, color: "#6b7585", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        {note && <div style={{ fontSize: 11, color: "#6b7585", marginTop: 5 }}>{note}</div>}
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 24px 60px", fontFamily: "sans-serif", color: "#d4d8e2", background: "#0d0f14", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: "#4a7cff", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6 }}>ARIS · Federal Pre-Bid Risk Intelligence</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{meta.agency || "Federal Agency"}{meta.solicitation_number ? ` · ${meta.solicitation_number}` : ""}</h1>
          <div style={{ fontSize: 12, color: "#6b7585", marginTop: 5 }}>{[meta.naics_code && `NAICS ${meta.naics_code}`, meta.set_aside_type, meta.contract_type].filter(Boolean).join(" · ")}</div>
        </div>
        <button onClick={onReset} style={{ padding: "8px 14px", background: "transparent", border: "1px solid #2a2f3a", borderRadius: 6, color: "#6b7585", cursor: "pointer", fontSize: 12 }}>← New RFP</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        <Card label="Bid Score"  value={`${comp.bid_score}%`} color={scoreColor} />
        <Card label="High Risk"  value={comp.high_risk_count} color={comp.high_risk_count > 0 ? "#ff5f5f" : "#2dd4a0"} />
        <Card label="Mandatory"  value={comp.mandatory_requirements} />
        <Card label="Deadline"   value={sub.deadline ? sub.deadline.slice(0,18) : "Not found"} color={sub.days_until_deadline !== null && sub.days_until_deadline < 7 ? "#f5a623" : "#d4d8e2"} note={sub.days_until_deadline !== null ? `${sub.days_until_deadline} days remaining` : null} />
        <Card label="Page Limit" value={sub.page_limit || "—"} />
      </div>
      {confidence_metrics.validator_flagged && (
        <div style={{ background: "#1a1400", border: "1px solid #5a3d00", borderRadius: 8, padding: "11px 16px", marginBottom: 18, fontSize: 13, color: "#f5a623" }}>
          ⚠ Confidence {(confidence_metrics.extraction_confidence * 100).toFixed(0)}% — {confidence_metrics.possible_missed_mandatory > 0 ? `${confidence_metrics.possible_missed_mandatory} possible missed mandatory requirements. Review manually.` : "Document may lack standard federal RFP markers. Review manually."}
        </div>
      )}
      {gaps.length > 0 && (
        <div style={{ background: "#110a0a", border: "1px solid #3d1515", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontWeight: 600, color: "#ff5f5f", marginBottom: 14, fontSize: 13 }}>Risk Flags & Required Actions ({gaps.length})</div>
          {gaps.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 10, paddingBottom: 10, borderBottom: i < gaps.length - 1 ? "1px solid #1e0f0f" : "none" }}>
              <span style={{ color: riskColor(g.severity), fontSize: 10, fontWeight: 700, minWidth: 52, paddingTop: 2, textTransform: "uppercase" }}>{g.severity}</span>
              <div>
                <div style={{ fontSize: 13, color: "#ffbbbb", marginBottom: 3 }}>{g.gap_reason}</div>
                <div style={{ fontSize: 12, color: "#888" }}>→ {g.recommended_action}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, color: "#4a7cff", fontWeight: 600 }}>Compliance Matrix</div>
          <span style={{ fontSize: 11, color: "#6b7585" }}>{requirements.length} total · {comp.high_risk_count} high · {comp.review_required_count} review</span>
        </div>
        <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #1e2330" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#13161e" }}>{["", "ID", "Requirement", "Section", "Category", "Type", "Disq.", "Risk"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {requirements.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#0d0f14" : "#0f1218" }}>
                  <td style={{ ...td, textAlign: "center", fontSize: 15 }}>{riskIcon(r.risk_level)}</td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 11, color: "#6b7585", whiteSpace: "nowrap" }}>{r.requirement_id}</td>
                  <td style={{ ...td, maxWidth: 360 }}>{r.text}</td>
                  <td style={{ ...td, color: "#6b7585", fontSize: 12, whiteSpace: "nowrap" }}>{r.section || "—"}</td>
                  <td style={{ ...td, fontSize: 12, color: "#8899bb", whiteSpace: "nowrap" }}>{r.category}</td>
                  <td style={{ ...td, fontSize: 12, whiteSpace: "nowrap" }}>{r.type}</td>
                  <td style={{ ...td, textAlign: "center", fontWeight: 700, fontSize: 12, color: r.is_disqualifying_if_missing ? "#ff5f5f" : "#3a4150" }}>{r.is_disqualifying_if_missing ? "YES" : "No"}</td>
                  <td style={{ ...td, fontWeight: 600, color: riskColor(r.risk_level), whiteSpace: "nowrap" }}>{r.risk_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {evalSum.evaluation_factors?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, color: "#4a7cff", fontWeight: 600, marginBottom: 10 }}>Evaluation Factors</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {evalSum.evaluation_factors.map((f, i) => (
              <div key={i} style={{ background: "#13161e", border: "1px solid #252932", borderRadius: 8, padding: "14px 18px", minWidth: 130 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#4a7cff" }}>{f.weight_percentage}%</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{f.factor_name}</div>
                {f.section_reference && <div style={{ fontSize: 11, color: "#6b7585", marginTop: 2 }}>{f.section_reference}</div>}
              </div>
            ))}
          </div>
          {evalSum.lowest_price_technically_acceptable && <div style={{ marginTop: 8, fontSize: 12, color: "#f5a623" }}>⚠ LPTA — price likely drives award</div>}
        </div>
      )}
      {far_clauses_detected?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, color: "#4a7cff", fontWeight: 600, marginBottom: 10 }}>FAR/DFARS Clauses ({far_clauses_detected.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 8 }}>
            {far_clauses_detected.map((f, i) => (
              <div key={i} style={{ background: "#13161e", border: "1px solid #1e2330", borderRadius: 6, padding: "11px 14px" }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a7cff", marginBottom: 3 }}>{f.clause_number}</div>
                <div style={{ fontSize: 13, marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "#6b7585" }}>{f.risk_note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: "1px solid #1a1e28" }}>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(proposal, null, 2))} style={{ padding: "9px 18px", background: "#4a7cff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Copy JSON</button>
        <button onClick={() => window.print()} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #2a2f3a", borderRadius: 6, color: "#6b7585", cursor: "pointer", fontSize: 13 }}>Print Report</button>
      </div>
    </div>
  );
}
