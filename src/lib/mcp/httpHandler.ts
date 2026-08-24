import { NextRequest, NextResponse } from "next/server";
import { callMcpTool, MCP_TOOLS } from "@/lib/mcp/server";
import { SITE_BRAND } from "@/lib/siteBrand";
import { mcpCorsHeaders } from "@/lib/mcpDiscovery";

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
};

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function jsonRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown
) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  };
}

async function handleMessage(msg: JsonRpcRequest) {
  const id = (msg.id ?? null) as JsonRpcId;
  const method = typeof msg.method === "string" ? msg.method : "";

  if (method === "initialize" || method === "server/discover") {
    return jsonRpcResult(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: {
        name: `${SITE_BRAND}-public-mcp`,
        version: "1.0.0",
        title: `${SITE_BRAND} Public MCP`,
      },
      instructions:
        "Read-only EventForYou tools. Call tools/list then tools/call. No auth required.",
    });
  }

  if (method === "notifications/initialized" || method === "ping") {
    if (msg.id === undefined) return null;
    return jsonRpcResult(id, {});
  }

  if (method === "tools/list") {
    return jsonRpcResult(id, {
      tools: MCP_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    });
  }

  if (method === "tools/call") {
    const params = msg.params ?? {};
    const name = typeof params.name === "string" ? params.name : "";
    const args =
      params.arguments && typeof params.arguments === "object"
        ? (params.arguments as Record<string, unknown>)
        : {};
    if (!name) {
      return jsonRpcError(id, -32602, "Missing tool name");
    }
    const out = await callMcpTool(name, args);
    return jsonRpcResult(id, out);
  }

  if (method === "resources/list") {
    return jsonRpcResult(id, { resources: [] });
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

/** Streamable HTTP JSON-RPC POST (shared by /mcp and /.well-known/mcp). */
export async function handleMcpPost(req: NextRequest): Promise<NextResponse> {
  const cors = mcpCorsHeaders();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(jsonRpcError(null, -32700, "Parse error"), {
      status: 400,
      headers: cors,
    });
  }

  const messages = Array.isArray(body) ? body : [body];
  const responses: unknown[] = [];

  for (const raw of messages) {
    if (!raw || typeof raw !== "object") {
      responses.push(jsonRpcError(null, -32600, "Invalid Request"));
      continue;
    }
    const out = await handleMessage(raw as JsonRpcRequest);
    if (out != null) responses.push(out);
  }

  if (Array.isArray(body)) {
    return NextResponse.json(responses, { headers: cors });
  }

  if (responses.length === 0) {
    return new NextResponse(null, { status: 202, headers: cors });
  }

  return NextResponse.json(responses[0], { headers: cors });
}
