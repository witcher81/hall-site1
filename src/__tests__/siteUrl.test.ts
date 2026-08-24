import { afterEach, describe, expect, it, vi } from "vitest";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("prefers NEXT_PUBLIC_SITE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "hall-site1.vercel.app");
    vi.stubEnv("VERCEL_URL", "hall-site1-preview.vercel.app");
    const { getSiteUrl } = await import("@/lib/siteUrl");
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("uses VERCEL_PROJECT_PRODUCTION_URL over preview VERCEL_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "hall-site1.vercel.app");
    vi.stubEnv("VERCEL_URL", "hall-site1-2cppy3jxx-witcher81s-projects.vercel.app");
    vi.stubEnv("VERCEL", "1");
    const { getSiteUrl } = await import("@/lib/siteUrl");
    expect(getSiteUrl()).toBe("https://hall-site1.vercel.app");
  });

  it("falls back to stable production host on Vercel without env", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL", "1");
    const { getSiteUrl } = await import("@/lib/siteUrl");
    expect(getSiteUrl()).toBe("https://hall-site1.vercel.app");
  });
});
