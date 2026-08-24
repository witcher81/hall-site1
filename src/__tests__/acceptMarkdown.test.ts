import { describe, expect, it } from "vitest";
import {
  negotiateHtmlOrMarkdown,
  parseAccept,
  isMarkdownNegotiablePath,
} from "@/lib/acceptMarkdown";

describe("acceptMarkdown", () => {
  it("prefers markdown when Accept is text/markdown", () => {
    expect(negotiateHtmlOrMarkdown("text/markdown")).toEqual({
      kind: "markdown",
    });
  });

  it("serves HTML for */* and missing Accept (crawlers/curl)", () => {
    expect(negotiateHtmlOrMarkdown("*/*")).toEqual({ kind: "html" });
    expect(negotiateHtmlOrMarkdown(null)).toEqual({ kind: "html" });
  });

  it("prefers html for typical browser Accept", () => {
    expect(
      negotiateHtmlOrMarkdown(
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      )
    ).toEqual({ kind: "html" });
  });

  it("returns not_acceptable when only unsupported types", () => {
    expect(negotiateHtmlOrMarkdown("application/xml")).toEqual({
      kind: "not_acceptable",
    });
  });

  it("parses q-values", () => {
    const ranges = parseAccept("text/html;q=0.5, text/markdown");
    expect(ranges[0].subtype).toBe("markdown");
    expect(ranges[0].q).toBe(1);
  });

  it("recognizes negotiable paths", () => {
    expect(isMarkdownNegotiablePath("/")).toBe(true);
    expect(isMarkdownNegotiablePath("/about")).toBe(true);
    expect(isMarkdownNegotiablePath("/dashboard")).toBe(false);
  });
});
