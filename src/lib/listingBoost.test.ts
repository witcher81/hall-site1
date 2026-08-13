import { describe, expect, it } from "vitest";
import { isBoostActive, nextBoostExpiry } from "@/lib/listingBoost";

describe("listingBoost", () => {
  it("treats missing or past expiry as inactive", () => {
    expect(isBoostActive(null)).toBe(false);
    expect(isBoostActive(new Date(Date.now() - 60_000))).toBe(false);
    expect(isBoostActive(new Date(Date.now() + 60_000))).toBe(true);
  });

  it("extends from current expiry when still active", () => {
    const now = new Date("2026-08-13T10:00:00.000Z");
    const current = new Date("2026-08-15T10:00:00.000Z");
    const next = nextBoostExpiry(current, 7, now);
    expect(next.toISOString()).toBe("2026-08-22T10:00:00.000Z");
  });

  it("starts from now when no active boost", () => {
    const now = new Date("2026-08-13T10:00:00.000Z");
    const next = nextBoostExpiry(null, 7, now);
    expect(next.toISOString()).toBe("2026-08-20T10:00:00.000Z");
  });
});
