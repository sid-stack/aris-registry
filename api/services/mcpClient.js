import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVERS_DIR = join(__dirname, "..", "servers");

/**
 * ARIS MCP Client Bridge
 * Orchestrates calls to the modular MCP servers.
 */

async function createClient(serverPath) {
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...process.env,
    },
  });

  const client = new Client(
    { name: "aris-host", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  return client;
}

export const samClient = await createClient(join(SERVERS_DIR, "mcp-data-source", "sam-mcp.js"));
export const auditClient = await createClient(join(SERVERS_DIR, "mcp-audit", "audit-mcp.js"));
export const bankingClient = await createClient(join(SERVERS_DIR, "mcp-data-source", "fdic-mcp.js"));

export async function callMcpTool(client, toolName, args) {
  return await client.callTool({
    name: toolName,
    arguments: args,
  });
}
