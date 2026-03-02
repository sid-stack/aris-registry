export function computeScore(requirements, meta) {
  let score = 100;
  const gaps = [];
  for (const r of requirements) {
    const id = r.requirement_id;
    const short = (r.text || "").slice(0, 90);
    if (r.risk_level === "High" && r.is_disqualifying_if_missing) {
      score -= 20;
      gaps.push({ requirement_id: id, gap_reason: `Disqualifying: ${short}`, recommended_action: "Must resolve before submission — disqualification risk.", severity: "High" });
    } else if (r.risk_level === "High") {
      score -= 10;
      gaps.push({ requirement_id: id, gap_reason: `High risk unverified: ${short}`, recommended_action: "Verify compliance and document evidence.", severity: "High" });
    } else if (r.risk_level === "Medium") {
      score -= 5;
      gaps.push({ requirement_id: id, gap_reason: `Medium risk: ${short}`, recommended_action: "Address in proposal and confirm compliance.", severity: "Medium" });
    } else if (r.risk_level === "Review Required") {
      score -= 3;
      gaps.push({ requirement_id: id, gap_reason: `Needs review: ${short}`, recommended_action: "Manually verify before submission.", severity: "Low" });
    }
  }
  if (meta.days_until_deadline !== null && meta.days_until_deadline < 5) {
    score -= 10;
    gaps.push({ requirement_id: "deadline_risk", gap_reason: `Deadline in ${meta.days_until_deadline} days`, recommended_action: "Begin immediately. Prioritize all disqualifying requirements.", severity: "High" });
  }
  if (meta.page_limit) gaps.push({ requirement_id: "page_limit", gap_reason: `Page limit: ${meta.page_limit}`, recommended_action: `Confirm proposal does not exceed ${meta.page_limit}.`, severity: "Low" });
  return { score: Math.max(0, Math.round(score)), gaps };
}
