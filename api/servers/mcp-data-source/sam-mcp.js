import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * ARIS Procurement MCP Server
 * Specialized toolset for SAM.gov data extraction and solicitation harvesting.
 */

const SAM_API_KEY = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;

const server = new Server(
  {
    name: "aris-procurement",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── Utilities (Extracted from api/index.js) ───────────────────────────────

function parseNoticeId(url) {
  const oppMatch = url.match(/\/opp\/([a-f0-9]{32})/i);
  if (oppMatch) return oppMatch[1];
  const workspaceMatch = url.match(/\/opp\/([a-f0-9]+)/i);
  if (workspaceMatch) return workspaceMatch[1];
  const qMatch = url.match(/[?&]noticeId=([^&]+)/i);
  if (qMatch) return qMatch[1];
  return null;
}

function scoreByName(name) {
  const n = name.toLowerCase();
  let score = 0;
  if (/solicitation|combined|rfp|sol_|sol-/.test(n)) score += 50;
  if (/statement.of.work|sow/.test(n)) score += 40;
  if (/performance.work.statement|pws/.test(n)) score += 30;
  if (/amendment|amd|qa|questions/.test(n)) score -= 20;
  if (/wage.determination|exhibit/.test(n)) score -= 60;
  if (/attachment/.test(n)) score -= 10;
  return score;
}

async function scoreAttachments(links, apiKey) {
  const sample = links.slice(0, 15);
  const results = await Promise.all(
    sample.map(async (url) => {
      try {
        const sep = url.includes("?") ? "&" : "?";
        const fullUrl = url.includes("api_key") ? url : `${url}${sep}api_key=${apiKey}`;
        const res = await fetch(fullUrl, { method: "HEAD", redirect: "manual" });
        const disp = res.headers.get("content-disposition") || "";
        const loc = res.headers.get("location") || "";
        const dispMatch = disp.match(/filename[^;=\n]*=["']?([^"'\n]+)["']?/i);
        const locMatch = decodeURIComponent(loc).match(/filename=([^&]+)/);
        const name = (dispMatch?.[1] || locMatch?.[1] || url.split("/").pop()).trim();
        const score = scoreByName(name);
        return { url, name, score };
      } catch (e) {
        return { url, name: url.split("/").pop(), score: 0 };
      }
    })
  );
  return results.sort((a, b) => b.score - a.score);
}

async function downloadWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}

// ─── Tool Definitions ───────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_opportunity",
        description: "Fetch opportunity metadata and attachments from SAM.gov",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The SAM.gov opportunity URL" },
          },
          required: ["url"],
        },
      },
      {
        name: "download_solicitation",
        description: "Download and score best-matching solicitation PDF from top links",
        inputSchema: {
          type: "object",
          properties: {
            links: { type: "array", items: { type: "string" } },
            noticeId: { type: "string" },
          },
          required: ["links"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_opportunity": {
      const noticeId = parseNoticeId(args.url);
      if (!noticeId) throw new Error("Invalid SAM.gov URL");

      const samRes = await fetch(
        `https://api.sam.gov/opportunities/v2/search?noticeid=${noticeId}&limit=1&api_key=${SAM_API_KEY}`
      );
      if (!samRes.ok) throw new Error(`SAM.gov error: ${samRes.status}`);

      const samData = await samRes.json();
      const opportunity = samData?.opportunitiesData?.[0];
      if (!opportunity) throw new Error("Opportunity not found");

      return {
        content: [{ type: "text", text: JSON.stringify(opportunity) }],
      };
    }

    case "download_solicitation": {
      const ranked = await scoreAttachments(args.links, SAM_API_KEY);
      const target = ranked.find((r) => r.score >= -10 && /\.pdf$/i.test(r.name));
      if (!target) throw new Error("No suitable PDF solicitation found");

      const downloadUrl = target.url.includes("api_key")
        ? target.url
        : `${target.url}?api_key=${SAM_API_KEY}`;
      const buffer = await downloadWithRetry(downloadUrl);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: target.name,
              base64: buffer.toString("base64"),
              score: target.score,
            }),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ARIS Procurement MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
