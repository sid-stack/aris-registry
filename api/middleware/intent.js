const HARD_SIGNALS = [
  /Section\s+[LM]\b/i,
  /FAR\s+\d{2}\.\d{3}/i,
  /NAICS\s+(?:Code\s+)?\d{6}/i,
  /solicitation\s+(?:number|no\.?)/i,
  /Defense Federal Acquisition/i,
  /System for Award Management|SAM\.gov/i,
  /Contracting\s+Officer/i,
  /offeror\s+shall/i,
  /statement\s+of\s+work/i,
  /performance\s+work\s+statement/i,
];
const HARD_REJECT = [
  /terms\s+and\s+conditions\s+of\s+sale/i,
  /privacy\s+policy/i,
  /invoice\s+number/i,
  /receipt\s+for\s+payment/i,
  /lease\s+agreement/i,
];

export function fastClassify(text) {
  const sample = text.slice(0, 3000);
  for (const r of HARD_REJECT) {
    if (r.test(sample)) return { isFederalRFP: false, confidence: 0.95, reason: "Document matches non-RFP pattern: " + r.toString(), usedLLM: false };
  }
  const hits = HARD_SIGNALS.filter(r => r.test(sample));
  if (hits.length >= 3) return { isFederalRFP: true, confidence: 0.95, reason: `${hits.length} federal RFP signals detected`, usedLLM: false };
  return null;
}

export async function classifyIntent(text, llmClient) {
  const fast = fastClassify(text);
  if (fast) return fast;
  const res = await llmClient.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    max_tokens: 200,
    temperature: 0,
    messages: [{ role: "user", content: `Is the following document a U.S. Federal Government solicitation (RFP, RFQ, IFB, or similar)?\n\nAnswer with JSON only:\n{"is_federal_rfp": true/false, "confidence": 0.0-1.0, "reason": "one sentence"}\n\nDocument excerpt:\n${text.slice(0, 2000)}` }]
  });
  const raw = res.choices[0]?.message?.content || "{}";
  try {
    const r = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
    return { isFederalRFP: r.is_federal_rfp, confidence: r.confidence, reason: r.reason, usedLLM: true };
  } catch {
    return { isFederalRFP: false, confidence: 0.5, reason: "Could not determine document type", usedLLM: true };
  }
}
