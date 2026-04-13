import { execSync } from "node:child_process";

const WORKFLOW_STEPS = ["login", "ingest", "decision", "matrix", "draft", "save", "export"];
const ALLOWLIST = [
  { step: "login", prefixes: ["src/App.jsx", "src/main.jsx", "src/pages/Landing.jsx"] },
  { step: "ingest", prefixes: ["src/pages/GovConDashboardV2.jsx", "api/services/samGov.js", "api/index.js"] },
  { step: "decision", prefixes: ["api/agents/strategist.js", "api/agents/coordinator.js", "api/index.js", "src/components/forge/IntelligenceBrief.jsx"] },
  { step: "matrix", prefixes: ["api/agents/auditor.js", "src/components/dashboard/ComplianceMatrix.jsx", "api/index.js"] },
  { step: "draft", prefixes: ["src/components/forge/ProposalForge.jsx", "api/index.js"] },
  { step: "save", prefixes: ["api/services/analytics.js", "api/index.js", "src/pages/GovConDashboardV2.jsx"] },
  { step: "export", prefixes: ["api/index.js", "src/components/forge/ProposalForge.jsx", "src/components/dashboard/ExportToolbar.jsx"] },
  { step: "meta", prefixes: ["docs/mvp/", ".github/workflows/", "scripts/mvp-scope-gate.mjs", "README.md", "package.json"] },
];

function changedFiles() {
  const base = process.env.MVP_GATE_BASE || "origin/main";
  try {
    const output = execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" }).trim();
    if (!output) return [];
    return output.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    const fallback = execSync("git diff --name-only HEAD~1...HEAD", { encoding: "utf8" }).trim();
    if (!fallback) return [];
    return fallback.split("\n").map((line) => line.trim()).filter(Boolean);
  }
}

function allowed(file) {
  return ALLOWLIST.some((entry) => entry.prefixes.some((prefix) => file.startsWith(prefix)));
}

const files = changedFiles();
const invalid = files.filter((file) => !allowed(file));
const declaredStep = process.env.MVP_WORKFLOW_STEP;
const isValidStep = !declaredStep || WORKFLOW_STEPS.includes(declaredStep);

if (!isValidStep) {
  console.error(`MVP gate failed: MVP_WORKFLOW_STEP must be one of ${WORKFLOW_STEPS.join(", ")}`);
  process.exit(1);
}

if (invalid.length > 0) {
  console.error("MVP gate failed: files changed outside MVP allowlist.");
  console.error("Either move this work out of the MVP branch, or update allowlist intentionally.");
  invalid.forEach((file) => console.error(` - ${file}`));
  process.exit(1);
}

console.log(`MVP scope gate passed for ${files.length} changed file(s).`);
if (!declaredStep) {
  console.log("Tip: set MVP_WORKFLOW_STEP in CI to tie each PR to one workflow step.");
}
