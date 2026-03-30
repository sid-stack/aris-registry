import { extractionAgent } from "./extraction.js";
import { complianceAgent } from "./compliance.js";
import { strategyAgent } from "./strategy.js";

/**
 * ARIS Sovereign Coordinator
 * Orchestrates the multi-agent swarm for RFP auditing.
 */
export async function invokeAuditSwarm(rfpData, onLog) {
  const swarmContext = {
    rawText: rfpData.text,
    buffer: rfpData.buffer,
    logs: [],
    results: {}
  };

  const streamLog = (agent, message) => {
    const entry = `[${agent.toUpperCase()}] ${message}`;
    swarmContext.logs.push(entry);
    if (onLog) onLog(entry);
  };

  // Phase 1: Structural Extraction
  streamLog("coordinator", "DEPLOYING_EXTRACTION_AGENT...");
  swarmContext.results.extraction = await extractionAgent.process(swarmContext, (msg) => streamLog("extraction", msg));

  // Phase 2: Regulatory Compliance
  streamLog("coordinator", "DEPLOYING_COMPLIANCE_AGENT...");
  swarmContext.results.compliance = await complianceAgent.process(swarmContext, (msg) => streamLog("compliance", msg));

  // Phase 3: Strategic Win-Themes
  streamLog("coordinator", "DEPLOYING_STRATEGY_AGENT...");
  swarmContext.results.strategy = await strategyAgent.process(swarmContext, (msg) => streamLog("strategy", msg));

  streamLog("coordinator", "SWARM_AUDIT_COMPLETE_IDLE");

  // Final Synthesis
  return synthesizeSwarmResults(swarmContext);
}

function synthesizeSwarmResults(ctx) {
  const { extraction, compliance, strategy } = ctx.results;
  
  return {
    ...extraction,
    bugs: compliance.bugs || [],
    requirements: compliance.requirements || extraction.requirements,
    strategicAnalysis: strategy.analysis,
    executiveSummary: strategy.summary || extraction.executiveSummary,
    riskAssessment: compliance.riskAssessment || extraction.riskAssessment,
    fatalError: compliance.bugs?.length > 0
  };
}
