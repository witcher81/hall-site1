import { describe, expect, it, vi } from "vitest";

describe("openapi.json route", () => {
  it("uses operationIds and inline typed schemas for every operation", async () => {
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
          parameters?: Array<{ schema?: { type?: string } }>;
          responses?: Record<
            string,
            {
              content?: {
                "application/json"?: { schema?: { type?: string; $ref?: string } };
              };
            }
          >;
        };
      }
    >;
    const ops = Object.values(paths).map((p) => p.get).filter(Boolean);
    expect(ops.length).toBe(5);
    for (const op of ops) {
      expect(op!.operationId).toBeTruthy();
      expect(op!.description).toBeTruthy();
      expect((op!.parameters ?? []).length).toBeGreaterThan(0);
      expect(op!.parameters!.every((p) => p.schema?.type)).toBe(true);
      const schema = op!.responses?.["200"]?.content?.["application/json"]?.schema;
      expect(schema?.type).toBe("object");
    }
    expect(spec.components.schemas.ApiIndexResponse).toBeTruthy();
    expect(spec.components.schemas.HealthResponse).toBeTruthy();
    expect(spec.components.schemas.VenueListResponse).toBeTruthy();
    expect(spec.components.schemas.ServiceListResponse).toBeTruthy();
  });
});
