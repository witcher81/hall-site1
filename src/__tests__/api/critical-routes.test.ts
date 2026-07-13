import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { buildProductionHealthReport } from "@/lib/productionHealth";

describe("productionHealth / health API logic", () => {
  it("reports ok in non-production without secrets", () => {
    const report = buildProductionHealthReport();
    expect(report).toHaveProperty("ok");
    expect(report).toHaveProperty("production");
    expect(Array.isArray(report.warnings)).toBe(true);
  });
});

describe("POST /api/webhooks/listing-moderation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns 503 when webhook secret is not configured", async () => {
    vi.stubEnv("WEBHOOK_INBOUND_SECRET", "");
    const { POST } = await import("@/app/api/webhooks/listing-moderation/route");
    const req = new NextRequest("http://localhost/api/webhooks/listing-moderation", {
      method: "POST",
      body: JSON.stringify({
        listingType: "VENUE",
        listingId: 1,
        decision: "APPROVED",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("returns 401 for bad secret", async () => {
    vi.stubEnv("WEBHOOK_INBOUND_SECRET", "correct-secret");
    const { POST } = await import("@/app/api/webhooks/listing-moderation/route");
    const req = new NextRequest("http://localhost/api/webhooks/listing-moderation", {
      method: "POST",
      headers: { "x-hall-webhook-secret": "wrong" },
      body: JSON.stringify({
        listingType: "VENUE",
        listingId: 1,
        decision: "APPROVED",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("accepts valid decision payload", async () => {
    vi.stubEnv("WEBHOOK_INBOUND_SECRET", "correct-secret");
    vi.doMock("@/lib/listingModerationService", () => ({
      applyListingModerationDecision: vi.fn(async () => ({ ok: true })),
    }));
    const { POST } = await import("@/app/api/webhooks/listing-moderation/route");
    const req = new NextRequest("http://localhost/api/webhooks/listing-moderation", {
      method: "POST",
      headers: { "x-hall-webhook-secret": "correct-secret" },
      body: JSON.stringify({
        listingType: "SERVICE",
        listingId: 42,
        decision: "REJECTED",
        note: "תוכן לא מתאים",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("rejects invalid listingType", async () => {
    vi.stubEnv("WEBHOOK_INBOUND_SECRET", "correct-secret");
    vi.doMock("@/lib/listingModerationService", () => ({
      applyListingModerationDecision: vi.fn(async () => ({ ok: true })),
    }));
    const { POST } = await import("@/app/api/webhooks/listing-moderation/route");
    const req = new NextRequest("http://localhost/api/webhooks/listing-moderation", {
      method: "POST",
      headers: { authorization: "Bearer correct-secret" },
      body: JSON.stringify({
        listingType: "NOPE",
        listingId: 1,
        decision: "APPROVED",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/moderation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 403 when not admin", async () => {
    vi.doMock("@/lib/requireAdmin", () => ({
      requireAdminApi: vi.fn(async () => ({
        user: null,
        denied: Response.json({ error: "Forbidden" }, { status: 403 }),
      })),
    }));
    const { GET } = await import("@/app/api/admin/moderation/route");
    const req = new NextRequest("http://localhost/api/admin/moderation");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/login validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 400 for invalid email before DB lookup", async () => {
    vi.doMock("@/lib/turnstile", () => ({
      verifyTurnstileToken: vi.fn(async () => ({ ok: true })),
    }));
    vi.doMock("@/lib/prisma", () => ({
      prisma: { user: { findUnique: vi.fn() } },
    }));
    vi.doMock("@/lib/auth", () => ({
      clearSessionCookie: vi.fn(),
      createSessionToken: vi.fn(),
      setPendingVerificationCookie: vi.fn(),
      setPendingVerificationCookieOnResponse: vi.fn(),
      setSessionCookie: vi.fn(),
      setSessionCookieOnResponse: vi.fn(),
      verifyPassword: vi.fn(),
    }));
    vi.doMock("@/lib/sendEmailVerification", () => ({
      sendEmailVerificationForUser: vi.fn(),
      verificationEmailClientPayload: vi.fn(() => ({})),
    }));

    const { POST } = await import("@/app/api/auth/login/route");
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email", password: "123456" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
