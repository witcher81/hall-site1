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

function prefersSse(accept: string | null): boolean {
  if (!accept) return false;
  const lower = accept.toLowerCase();
  const sse = lower.includes("text/event-stream");
  const json = lower.includes("application/json");
  if (sse && !json) return true;
  if (sse && json) {
    // Prefer SSE when listed first or explicitly with higher q (is-agentic style).
    const sseIdx = lower.indexOf("text/event-stream");
    const jsonIdx = lower.indexOf("application/json");
    return sseIdx >= 0 && (jsonIdx < 0 || sseIdx <= jsonIdx);
  }
  return false;
}

function sseMessage(payload: unknown): string {
  return `event: message\ndata: ${JSON.stringify(payload)}\n\n`;
}

async function handleMessage(msg: JsonRpcRequest) {
  const id = (msg.id ?? null) as JsonRpcId;
  const method = typeof msg.method === "string" ? msg.method : "";

  if (method === "initialize" || method === "server/discover") {
    const requested =
      typeof msg.params?.protocolVersion === "string"
        ? msg.params.protocolVersion
        : "2025-11-25";
    const protocolVersion = [
      "2025-11-25",
      "2025-06-18",
      "2024-11-05",
    ].includes(requested)
      ? requested
      : "2025-11-25";

    return jsonRpcResult(id, {
      protocolVersion,
      capabilities: { tools: { listChanged: true } },
      serverInfo: {
        name: "com.eventforyou/public-mcp",
        version: "1.0.0",
        title: `${SITE_BRAND} Public MCP`,
      },
      instructions:
        "Read-only EventForYou tools. Call tools/list then tools/call. No auth required. Docs: /developers",
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

/** Streamable HTTP JSON-RPC POST (JSON or SSE). */
export async function handleMcpPost(req: NextRequest): Promise<NextResponse> {
  const useSse = prefersSse(req.headers.get("accept"));
  const cors = mcpCorsHeaders(
    useSse
      ? {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        }
      : undefined
  );

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    if (useSse) {
      return new NextResponse(sseMessage(jsonRpcError(null, -32700, "Parse error")), {
        status: 400,
        headers: cors,
      });
    }
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

  if (responses.length === 0) {
    return new NextResponse(null, { status: 202, headers: cors });
  }

  if (useSse) {
    const streamBody = Array.isArray(body)
      ? responses.map(sseMessage).join("")
      : sseMessage(responses[0]);
    return new NextResponse(streamBody, { status: 200, headers: cors });
  }

  if (Array.isArray(body)) {
    return NextResponse.json(responses, { headers: cors });
  }

  return NextResponse.json(responses[0], { headers: cors });
}
