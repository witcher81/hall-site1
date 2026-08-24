import { describe, expect, it, vi } from "vitest";

describe("openapi.json route", () => {
  it("uses operationIds and $ref response schemas for every operation", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hall-site1.vercel.app");
    const { GET } = await import("@/app/openapi.json/route");
    const res = GET();
    const spec = await res.json();

    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.externalDocs?.url).toContain("/deprecation");
    expect(res.headers.get("Deprecation")).toBe("false");
    expect(res.headers.get("Link")).toContain('rel="deprecation"');

    const paths = spec.paths as Record<
      string,
      {
        get?: {
          operationId?: string;
          description?: string;
          responses?: Record<
            string,
            { content?: { "application/json"?: { schema?: { $ref?: string } } } }
          >;
        };
      }
    >;
    const ops = Object.values(paths).map((p) => p.get).filter(Boolean);
    expect(ops.length).toBeGreaterThanOrEqual(4);
    for (const op of ops) {
      expect(op!.operationId).toBeTruthy();
      expect(op!.description).toBeTruthy();
      const ref = op!.responses?.["200"]?.content?.["application/json"]?.schema?.$ref;
      expect(ref).toMatch(/^#\/components\/schemas\//);
    }
    expect(spec.components.schemas.ApiIndexResponse).toBeTruthy();
    expect(spec.components.schemas.HealthResponse).toBeTruthy();
    expect(spec.components.schemas.VenueListResponse).toBeTruthy();
    expect(spec.components.schemas.ServiceListResponse).toBeTruthy();
  });
});
