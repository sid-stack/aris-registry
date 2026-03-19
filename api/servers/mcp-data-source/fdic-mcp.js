import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * ARIS Banking MCP Server (FDIC)
 * Specialized toolset for retrieving banking institution snapshots and financial health.
 */

const FDIC_BASE = (process.env.FDIC_API_BASE || "https://api.fdic.gov/v1").replace(/\/+$/, "");
const FDIC_TIMEOUT_MS = Number(process.env.FDIC_API_TIMEOUT_MS || 15000);

const server = new Server(
  {
    name: "aris-banking",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── Utilities (Adapted from api/services/fdic.js) ─────────────────────────

async function getJSON(path, params = {}) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${FDIC_BASE}${cleanPath}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  if (process.env.FDIC_API_KEY) {
    url.searchParams.set("api_key", process.env.FDIC_API_KEY);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FDIC_TIMEOUT_MS);
  
  try {
    const response = await fetch(url.toString(), { 
        method: "GET", 
        signal: controller.signal,
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`FDIC API ${response.status}: ${body.slice(0, 200)}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// ─── Tool Definitions ───────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_bank_snapshot",
        description: "Fetch institution snapshot and latest financials from FDIC",
        inputSchema: {
          type: "object",
          properties: {
            oid: { type: "string", description: "FDIC Institution OID" },
          },
          required: ["oid"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_bank_snapshot": {
      const oid = args.oid;
      
      // 1. Fetch Bank Info
      const bankRes = await getJSON(`/bankfind/${encodeURIComponent(oid)}`);
      const bank = bankRes?.bank || bankRes?.data || bankRes?.result || null;
      if (!bank) throw new Error(`FDIC institution not found for OID ${oid}`);

      // 2. Fetch Latest Financials
      const finRes = await getJSON(`/financials/${encodeURIComponent(oid)}`);
      const financials = finRes?.financials || finRes?.data || finRes?.results || [];
      const latest = financials[0] || {};

      const snapshot = {
        oid,
        name: bank?.name || bank?.institutionName || "Unknown Institution",
        city: bank?.city || null,
        state: bank?.state || null,
        cert: bank?.cert || bank?.certificateNumber || null,
        totalAssets: normalizeNumber(latest?.totalAssets ?? latest?.assets ?? latest?.asset),
        totalDeposits: normalizeNumber(latest?.totalDeposits ?? latest?.deposits),
        totalLoans: normalizeNumber(latest?.totalLoans ?? latest?.loans),
        netIncome: normalizeNumber(latest?.netIncome ?? latest?.income),
        roa: normalizeNumber(latest?.returnOnAssets ?? latest?.roa),
        roe: normalizeNumber(latest?.returnOnEquity ?? latest?.roe),
        financialPeriod: latest?.period || latest?.reportingPeriod || null,
        source: "fdic",
        retrievedAt: new Date().toISOString(),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(snapshot) }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ARIS Banking MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
