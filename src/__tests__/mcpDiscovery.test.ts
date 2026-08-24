import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  mcpDiscoveryDocument,
  mcpServerCard,
  mcpRegistryManifest,
} from "@/lib/mcpDiscovery";
import { handleMcpPost } from "@/lib/mcp/httpHandler";

describe("mcp discovery + live handshake", () => {
  it("publishes an official MCP server card with streamable-http remote", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hall-site1.vercel.app");
    const card = mcpServerCard();
    expect(card.$schema).toContain("server-card");
    expect(card.name).toBe("com.eventforyou/public-mcp");
    expect(card.remotes[0].type).toBe("streamable-http");
    expect(card.remotes[0].url).toContain("/mcp");
    expect(mcpRegistryManifest().remotes[0].url).toContain("/mcp");
  });

  it("keeps extended discovery document for agents", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hall-site1.vercel.app");
    const doc = mcpDiscoveryDocument();
    expect(doc.transport).toBe("streamable-http");
    expect(doc.handshake.live).toBe(true);
    expect(doc.handshake.initialize.method).toBe("initialize");
  });

  it("completes initialize over POST as JSON", async () => {
    const req = new NextRequest("https://hall-site1.vercel.app/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });
    const res = await handleMcpPost(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.protocolVersion).toBe("2025-11-25");
    expect(body.result.serverInfo.name).toBe("com.eventforyou/public-mcp");
  });

  it("completes initialize over POST as SSE when requested", async () => {
    const req = new NextRequest("https://hall-site1.vercel.app/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream, application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });
    const res = await handleMcpPost(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("event: message");
    expect(text).toContain("com.eventforyou/public-mcp");
  });
});
