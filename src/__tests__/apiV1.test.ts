import { describe, expect, it, vi } from "vitest";

describe("GET /api/v1", () => {
  it("returns versioning policy and endpoint list", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hall-site1.vercel.app");
    const { GET, POST } = await import("@/app/api/v1/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apiVersion).toBe("1");
    expect(body.versioning.strategy).toBe("url_path");
    expect(body.endpoints.length).toBeGreaterThanOrEqual(3);
    expect(body.errors.contentType).toBe("application/problem+json");

    const post = await POST();
    expect(post.status).toBe(405);
    expect(post.headers.get("Content-Type")).toContain("application/problem+json");
    const problem = await post.json();
    expect(problem.code).toBe("method_not_allowed");
  });
});
