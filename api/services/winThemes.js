/**
 * Win-Theme Architect Service
 * Generates 'Aggressive Consultant' strategic Power Plays.
 */

import { analyticsDb } from "./analytics.js";

export async function generateWinThemes(auditResult, patterns = []) {
  // Pull from Logic_Library to justify "Institutional Memory"
  let matchedPatterns = patterns;
  if (matchedPatterns.length === 0 && analyticsDb) {
    try {
      const { rows } = await analyticsDb.query(
        "SELECT * FROM logic_library ORDER BY frequency DESC LIMIT 2"
      );
      matchedPatterns = rows.map(r => ({ id: r.pattern_id, name: r.conflict_type }));
    } catch (err) {
      console.warn("[WIN_THEMES] Logic_Library query failed, using defaults.");
    }
  }

  const powerPlays = [
    {
      title: "The Compliance Shield (FAR 52.204-21)",
      move: `Leverage the ${matchedPatterns[0]?.name || "Section L/M Mismatch"} conflict to prioritize cybersecurity maturity ahead of competition.`,
      rationale: "Position as the only 'Zero-Risk' technical partner."
    },
    {
      title: "The Technical Pivot (NIST mapping)",
      move: `Exploit the agency's unstated preference for ${matchedPatterns[1]?.name || "Sovereign protocol scaling"} by emphasizing your modular infrastructure.`,
      rationale: "Discredits legacy monolithic competitors."
    },
    {
      title: "The 'Ghosting' Strategy",
      move: `Apply Pattern ${matchedPatterns[0]?.id || "#PAT-822"} to subtly highlight the fragility of competitor-specific cloud lock-ins.`,
      rationale: "Establishes ARIS as the neutral, multi-cloud standard."
    }
  ];

  return powerPlays;
}
