import { describe, expect, it } from "vitest";
import { MCP_TOOLS } from "@/lib/mcp/tools";

describe("MCP tools registry", () => {
  it("exposes required public read-only tools", () => {
    const names = MCP_TOOLS.map((t) => t.name);
    expect(names).toContain("search_halls");
    expect(names).toContain("get_venue");
    expect(names).toContain("search_services");
    expect(names).toContain("get_service");
    expect(names).toContain("get_provider");
    expect(names).toContain("get_site_overview");
  });

  it("each tool has a description and inputSchema", () => {
    for (const t of MCP_TOOLS) {
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.inputSchema).toMatchObject({ type: "object" });
    }
  });
});
