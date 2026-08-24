import { describe, expect, it } from "vitest";
import { markdownForPath } from "@/lib/publicMarkdown";

describe("publicMarkdown", () => {
  it("returns homepage markdown with brand and agent links", () => {
    const md = markdownForPath("/");
    expect(md).toContain("EventForYou");
    expect(md).toContain("/llms.txt");
    expect(md).toContain("/.well-known/mcp");
  });

  it("returns developers markdown", () => {
    const md = markdownForPath("/developers");
    expect(md).toContain("OpenAPI");
    expect(md).toContain("/mcp");
  });
});
