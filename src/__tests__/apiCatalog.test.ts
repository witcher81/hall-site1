import { describe, expect, it, vi } from "vitest";

describe("GET /api catalog and unknown API paths", () => {
  it("returns JSON catalog at /api", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hall-site1.vercel.app");
    const { GET, POST } = await import("@/app/api/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.current).toContain("/api/v1");
    expect(body.errorModel).toBe("application/problem+json");
    const post = await POST();
    expect(post.status).toBe(405);
    expect(post.headers.get("Content-Type")).toContain("application/problem+json");
  });

  it("returns JSON 404 for unknown API paths", async () => {
    const { GET } = await import("@/app/api/[...slug]/route");
    const res = await GET(new Request("http://localhost/api/no-such-endpoint"), {
      params: Promise.resolve({ slug: ["no-such-endpoint"] }),
    });
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toContain("application/problem+json");
    const body = await res.json();
    expect(body.code).toBe("not_found");
    expect(body.hint).toBeTruthy();
  });
});
