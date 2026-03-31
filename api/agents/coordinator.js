/**
 * BidSmith Audit Coordinator
 *
 * Thin wrapper that preserves the invokeAuditSwarm() interface used by index.js
 * while delegating to the new single-pass auditPipeline.
 *
 * The former 3-agent sequential chain (extraction → compliance → strategy) is
 * replaced by one LLM call in auditPipeline.js. See that file for rationale.
 */

import { runAudit } from "./auditPipeline.js";

export async function invokeAuditSwarm(rfpData, onLog) {
  if (onLog) onLog("[AUDIT] Starting single-pass compliance extraction...");

  const result = await runAudit(rfpData.text, rfpData.meta || {});

  if (onLog) onLog(`[AUDIT] Complete — ${result.requirements?.length || 0} requirements extracted`);

  return result;
}
