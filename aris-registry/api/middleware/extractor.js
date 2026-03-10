const FAR_PATTERN    = /FAR\s+(\d{2}\.\d{3}-\d{2,3})|DFARS\s+(252\.\d{3}-\d{4})/g;
const DEADLINE_PATS  = [
  /(?:proposals?|offers?|bids?|submissions?)\s+(?:are\s+)?due\s+(?:by\s+)?([^\n.]{5,60})/i,
  /(?:submission|closing|response)\s+deadline[:\s]+([^\n.]{5,60})/i,
  /(?:due|received\s+(?:no\s+later\s+than|by))[:\s]+([^\n.]{5,60})/i,
  /(\d{1,2}\/\d{1,2}\/\d{4}[^\n]{0,30}(?:AM|PM|CT|ET|PT|EST|CST|PST)?)/i,
  /([A-Z][a-z]+ \d{1,2},?\s*\d{4}[^\n]{0,30}(?:AM|PM)?)/,
];
const PAGE_LIMIT_PAT  = /(?:shall\s+not\s+exceed|limited\s+to|no\s+more\s+than|maximum\s+of)\s+(\d+)\s+pages?/i;
const NAICS_PAT       = /NAICS\s+(?:Code\s+)?(\d{6})/i;
const SOLNUM_PAT      = /(?:Solicitation|RFP|RFQ|IFB)\s+(?:Number|No\.?|#)?\s*:?\s*([A-Z0-9][A-Z0-9\-]{4,})/i;
const AGENCY_PATS     = [
  /Department\s+of\s+[A-Z][a-zA-Z\s]{3,40}/,
  /(?:U\.S\.|United\s+States)\s+[A-Z][a-zA-Z\s]{3,40}(?:Agency|Command|Center|Office|Bureau)/,
  /(?:Army|Navy|Air Force|Marine Corps|Coast Guard)[^\n,]{0,40}/i,
];
const SET_ASIDE_PAT   = /set[- ]aside[:\s]+([^\n,;]{5,60})/i;
const CONTRACT_PAT    = /contract\s+type[:\s]+([^\n,;]{5,40})/i;
const EVAL_PAT        = /([A-Z][a-zA-Z\s\/]{3,40})\s*[-–—:]\s*(\d{1,3})\s*%/g;
const MANDATORY_KW    = /\b(must|shall|required|will\s+be\s+required|failure\s+to|mandatory|minimum|shall\s+not\s+exceed|proposal\s+shall|offeror\s+shall|contractor\s+shall|is\s+required)\b/i;
const DISQ_KW         = /\b(disqualif|will\s+not\s+be\s+considered|rejected|ineligible|basis\s+for\s+rejection|will\s+result\s+in\s+rejection)\b/i;

export function extractMetadata(text) {
  const solMatch     = SOLNUM_PAT.exec(text);
  const naicsMatch   = NAICS_PAT.exec(text);
  const setAside     = SET_ASIDE_PAT.exec(text);
  const contractType = CONTRACT_PAT.exec(text);
  let agency = "";
  for (const p of AGENCY_PATS) { const m = p.exec(text); if (m) { agency = m[0].trim(); break; } }
  let deadline = null;
  for (const p of DEADLINE_PATS) { const m = p.exec(text); if (m) { deadline = m[1].trim(); break; } }
  const daysUntil = (() => { if (!deadline) return null; const d = new Date(deadline); if (isNaN(d)) return null; return Math.ceil((d - Date.now()) / 864e5); })();
  const pageMatch = PAGE_LIMIT_PAT.exec(text);
  const evalFactors = [];
  let ef; const efRe = new RegExp(EVAL_PAT.source, "g");
  while ((ef = efRe.exec(text)) !== null) { const pct = parseInt(ef[2]); if (pct > 0 && pct <= 100) evalFactors.push({ factor_name: ef[1].trim(), weight_percentage: pct, section_reference: "Section M" }); }
  const farRaw = []; let fm; const farRe = new RegExp(FAR_PATTERN.source, "g");
  while ((fm = farRe.exec(text)) !== null) farRaw.push(fm[1] || fm[2]);
  const sections = [];
  if (/Section\s+C\b/i.test(text)) sections.push("Section C");
  if (/Section\s+L\b/i.test(text)) sections.push("Section L");
  if (/Section\s+M\b/i.test(text)) sections.push("Section M");
  if (/Statement\s+of\s+Work/i.test(text)) sections.push("SOW");
  if (/Performance\s+Work\s+Statement/i.test(text)) sections.push("PWS");
  return {
    solicitation_number: solMatch?.[1] || "", agency, naics_code: naicsMatch?.[1] || "",
    set_aside_type: setAside?.[1]?.trim() || "", contract_type: contractType?.[1]?.trim() || "",
    detected_sections: sections, deadline, days_until_deadline: daysUntil,
    page_limit: pageMatch ? `${pageMatch[1]} pages` : "",
    late_submission_disqualifying: DISQ_KW.test(text), eval_factors: evalFactors,
    best_value_tradeoff: /best\s+value/i.test(text), lpta: /lowest\s+price\s+technically\s+acceptable|LPTA/i.test(text),
    far_clauses_raw: [...new Set(farRaw)],
  };
}

export function extractCandidates(text) {
  return text.split(/(?<=[.!\n])\s+/).map(s => s.replace(/\s+/g, " ").trim())
    .filter(s => s.length > 25 && s.length < 600 && (
      MANDATORY_KW.test(s) || DISQ_KW.test(s) ||
      /CMMC|clearance|bonding|insurance|SAM|FAR|DFARS|certif|OSHA|EMR|past\s+performance/i.test(s)
    ));
}
