/**
 * Curated GovCon KB — keyword routing, no embeddings (MVP).
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const GOVCON_KB_VERSION = "1";

const KB_DIR = join(__dirname, "../../docs/govcon-kb");

const SECTIONS = [
  {
    file: "sam-basics.md",
    patterns: [
      /sam\.?\s*gov/i,
      /\buei\b/i,
      /\bunique\s+entity/i,
      /\bregistration\b/i,
      /\bentity\s+registration/i,
      /\bvendor\s+database/i,
      /system\s+for\s+award\s+management/i,
    ],
  },
  {
    file: "opportunity-types.md",
    patterns: [
      /\bsolicitation\b/i,
      /\brfp\b/i,
      /\brfq\b/i,
      /\brfi\b/i,
      /sources\s+sought/i,
      /pre-?solicitation/i,
      /special\s+notice/i,
      /combined\s+synopsis/i,
    ],
  },
  {
    file: "workspace-qa.md",
    patterns: [
      /workspace/i,
      /\bq\s*\/\s*a\b/i,
      /\bq\s*&\s*a\b/i,
      /questions?\s+to\s+the\s+government/i,
      /amendment/i,
      /attachment/i,
      /nec[o]?/i,
    ],
  },
  {
    file: "far-pointers.md",
    patterns: [/\bfar\b/i, /\bdfars\b/i, /52\.2\d/i, /\bclause\b/i, /representation/i, /certif/i],
  },
];

function readKbFile(name) {
  const p = join(KB_DIR, name);
  if (!existsSync(p)) return "";
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

/**
 * Select KB excerpts from user message (+ light signals from audit if passed).
 */
export function selectGovconKb(userText, auditContext = null, maxChars = 3800) {
  const t = `${userText || ""} ${auditContext?.title || ""} ${auditContext?.agency || ""}`.toLowerCase();
  const picked = new Set();
  for (const { file, patterns } of SECTIONS) {
    if (patterns.some((re) => re.test(t))) picked.add(file);
  }
  if (picked.size === 0) picked.add("sam-basics.md");

  let buf = "";
  for (const file of picked) {
    const body = readKbFile(file);
    if (!body) continue;
    const header = `\n\n--- KB: ${file} ---\n\n`;
    const next = buf + header + body;
    if (next.length > maxChars) {
      const room = maxChars - buf.length - header.length;
      if (room > 200) buf += header + body.slice(0, room) + "\n[truncated]";
      break;
    }
    buf = next;
  }
  return buf.trim();
}
