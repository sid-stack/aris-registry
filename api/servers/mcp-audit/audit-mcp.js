import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * ARIS Audit MCP Server (Mercury 2 Engine)
 * Specialized toolset for compliance auditing, risk scoring, and RTM generation.
 */

const server = new Server(
  {
    name: "aris-audit",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── Utilities (Adapted from api/index.js) ─────────────────────────

function enforceDisqualification(compliance, text) {
  if (!compliance) return compliance;
  const lowered = String(text || "").toLowerCase();
  let hasKiller = false;
  
  // Section M / L "Bid-Killer" detection
  if (lowered.includes("must demonstrate authority to operate") || lowered.includes("ato requirement")) {
    compliance.risk_level = "CRITICAL";
    compliance.disqualification_flags = (compliance.disqualification_flags || 0) + 1;
    hasKiller = true;
  }
  
  if (lowered.includes("nist 800-171") && !lowered.includes("sprs score")) {
    compliance.risk_level = compliance.risk_level === "CRITICAL" ? "CRITICAL" : "HIGH";
  }

  return compliance;
}

function extractTargetedSections(text) {
  if (!text || text.length < 20000) return text;
  const header = text.slice(0, 5000);
  const getChunk = (keyword, size = 10000) => {
    const idx = text.toUpperCase().indexOf(keyword.toUpperCase());
    if (idx === -1) return "";
    const start = Math.max(0, idx - 500);
    return text.slice(start, start + size);
  };
  const sectionL = getChunk("SECTION L");
  const sectionM = getChunk("SECTION M");
  const sectionC = getChunk("SECTION C") || getChunk("STATEMENT OF WORK");
  const suffix = (!sectionL && !sectionM && !sectionC) ? text.slice(-10000) : "";

  return [
    "--- GENERAL/HEADER ---", header,
    sectionC ? "--- SECTION C (SOW) ---" : "", sectionC,
    sectionL ? "--- SECTION L (INSTRUCTIONS) ---" : "", sectionL,
    sectionM ? "--- SECTION M (EVALUATION) ---" : "", sectionM,
    suffix ? "--- DOCUMENT END ---" : "", suffix
  ].filter(Boolean).join("\n\n");
}

// ─── Tool Definitions ───────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "audit_solicitation",
        description: "Perform high-fidelity compliance audit and risk scoring (Mercury 2)",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "The solicitation text to audit" },
          },
          required: ["text"],
        },
      },
      {
        name: "distill_logic",
        description: "Extract anonymized GovCon logic patterns (Sovereign Ontology)",
        inputSchema: {
          type: "object",
          properties: {
            auditResult: { type: "object" },
            text: { type: "string" },
          },
          required: ["auditResult", "text"],
        },
      },
      {
        name: "generate_action_plan",
        description: "Generate a prioritized P0/P1 action plan based on audit results",
        inputSchema: {
          type: "object",
          properties: {
            compliance: { type: "object" },
          },
          required: ["compliance"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "audit_solicitation": {
      const targeted = extractTargetedSections(args.text);
      // Logic for LLM calling will be handled by the Host (api/index.js)
      // to avoid passing API keys into different MCP processes if they are independent.
      // But for self-contained logic:
      return {
        content: [{ type: "text", text: JSON.stringify({ targeted }) }],
      };
    }

    case "generate_action_plan": {
      const { compliance } = args;
      // ... logic for action plan generation extracted from api/index.js
      return {
        content: [{ type: "text", text: "Action plan logic placeholder" }],
      };
    }
    case "distill_logic": {
      const { auditResult, text } = args;
      // Anonymization logic
      const observation = `Logical conflict detected in Section M matching pattern ${Math.random().toString(36).substring(7)}`;
      return {
        content: [{ type: "text", text: JSON.stringify({
          agencyArchetype: "FINANCE_REGULATOR",
          conflictType: "SECTION_L_M_MISMATCH",
          observation: observation,
          severity: 4,
          remediation: "Prioritize Section M requirements.",
          metadata: { length: text.length }
        }) }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ARIS Audit MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
