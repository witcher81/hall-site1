import { describe, expect, it, vi } from "vitest";

describe("openapi.json route", () => {
  it("includes operationIds, descriptions, and problem schemas", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hall-site1.vercel.app");
    const { GET } = await import("@/app/openapi.json/route");
    const res = GET();
    const spec = await res.json();

    expect(spec.openapi).toMatch(/^3\./);
    const paths = spec.paths as Record<
      string,
      { get?: { operationId?: string; description?: string; responses?: Record<string, unknown> } }
    >;
    const ops = Object.values(paths).map((p) => p.get).filter(Boolean);
    expect(ops.length).toBeGreaterThanOrEqual(4);
    for (const op of ops) {
      expect(op!.operationId).toBeTruthy();
      expect(op!.description).toBeTruthy();
      expect(op!.responses?.["200"]).toBeTruthy();
    }
    expect(paths["/api/v1/venues"]?.get?.operationId).toBe("searchVenuesV1");
    const err429 = paths["/api/v1/venues"]?.get?.responses?.["429"] as {
      content?: { "application/problem+json"?: { schema?: unknown } };
    };
    expect(paths["/api/v1/health"]?.get?.responses?.["200"]).toEqual(
      expect.objectContaining({
        content: expect.objectContaining({
          "application/json": expect.objectContaining({
            schema: expect.objectContaining({ required: ["data"] }),
          }),
        }),
      })
    );
  });
});
