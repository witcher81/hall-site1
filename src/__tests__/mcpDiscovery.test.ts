import { describe, expect, it, vi } from "vitest";
import { mcpDiscoveryDocument } from "@/lib/mcpDiscovery";

describe("mcp discovery", () => {
  it("describes a live streamable-http handshake", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hall-site1.vercel.app");
    const doc = mcpDiscoveryDocument();
    expect(doc.transport).toBe("streamable-http");
    expect(doc.handshake.live).toBe(true);
    expect(doc.handshake.initialize.method).toBe("initialize");
    expect(Array.isArray(doc.endpoints)).toBe(true);
    expect(doc.endpoints[0].url).toContain("/mcp");
  });
});
