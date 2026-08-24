import { describe, expect, it } from "vitest";
import { markdownForPath } from "@/lib/publicMarkdown";

describe("publicMarkdown", () => {
  it("returns homepage markdown with brand and agent links", () => {
    const md = markdownForPath("/");
    expect(md).toContain("EventForYou");
    expect(md).toContain("/llms.txt");
    expect(md).toContain("/.well-known/mcp");
    expect(md).toContain("/api/v1");
    expect(md.length).toBeGreaterThan(500);
  });

  it("returns developers markdown with versioned API", () => {
    const md = markdownForPath("/developers");
    expect(md).toContain("OpenAPI");
    expect(md).toContain("/mcp");
    expect(md).toContain("/api/v1");
  });

  it("returns substantial contact markdown", () => {
    const md = markdownForPath("/contact");
    expect(md).toContain("Support email");
    expect(md.length).toBeGreaterThan(200);
  });
});
