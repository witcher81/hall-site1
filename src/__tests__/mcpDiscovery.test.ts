import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mcpDiscoveryDocument } from "@/lib/mcpDiscovery";
import { handleMcpPost } from "@/lib/mcp/httpHandler";

describe("mcp discovery + live handshake", () => {
  it("describes a live streamable-http handshake", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hall-site1.vercel.app");
    const doc = mcpDiscoveryDocument();
    expect(doc.transport).toBe("streamable-http");
    expect(doc.handshake.live).toBe(true);
    expect(doc.handshake.status).toBe("ready");
    expect(doc.handshake.initialize.method).toBe("initialize");
    expect(Array.isArray(doc.endpoints)).toBe(true);
    expect(doc.endpoints[0].url).toContain("/mcp");
  });

  it("completes initialize over POST (live handshake)", async () => {
    const req = new NextRequest("https://hall-site1.vercel.app/.well-known/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });
    const res = await handleMcpPost(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.protocolVersion).toBe("2024-11-05");
    expect(body.result.serverInfo.name).toContain("mcp");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
