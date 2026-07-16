import { describe, expect, it } from "vitest";
import {
  buildServiceCategoryAvailabilityFromCategories,
  isCityAvailable,
  isPrimaryAvailable,
  isSecondaryAvailable,
} from "@/lib/searchAvailabilityPure";

describe("searchAvailabilityPure", () => {
  it("marks cities with case-insensitive match", () => {
    expect(isCityAvailable(["תל אביב", "אור יהודה"], "אור יהודה")).toBe(true);
    expect(isCityAvailable(["תל אביב"], "אור יהודה")).toBe(false);
    expect(isCityAvailable(["תל אביב-יפו"], "  תל אביב-יפו  ")).toBe(true);
    expect(isCityAvailable([], "חיפה")).toBe(false);
  });

  it("builds primary/secondary availability from category strings", () => {
    const avail = buildServiceCategoryAvailabilityFromCategories([
      "מוזיקה ובמה / DJ ותקליטנים",
      "מוזיקה ובמה / זמר/ת לאירוע",
      "צילום ותיעוד / צילום סטילס לאירוע",
      "אוכל ומשקאות",
    ]);

    expect(isPrimaryAvailable(avail, "מוזיקה ובמה")).toBe(true);
    expect(isPrimaryAvailable(avail, "צילום ותיעוד")).toBe(true);
    expect(isPrimaryAvailable(avail, "אוכל ומשקאות")).toBe(true);
    expect(isPrimaryAvailable(avail, "יופי ואיפור")).toBe(false);

    expect(isSecondaryAvailable(avail, "מוזיקה ובמה", "DJ ותקליטנים")).toBe(
      true
    );
    expect(isSecondaryAvailable(avail, "מוזיקה ובמה", "להקה לאירוע")).toBe(
      false
    );
    expect(
      isSecondaryAvailable(avail, "צילום ותיעוד", "צילום סטילס לאירוע")
    ).toBe(true);
    // primary-only listing: secondary list empty for that primary in taxonomy filter
    expect(avail.secondariesByPrimary["אוכל ומשקאות"]).toEqual([]);
  });

  it("keeps taxonomy order for available secondaries", () => {
    const avail = buildServiceCategoryAvailabilityFromCategories([
      "מוזיקה ובמה / זמר/ת לאירוע · DJ ותקליטנים",
    ]);
    const secs = avail.secondariesByPrimary["מוזיקה ובמה"] ?? [];
    expect(secs).toContain("DJ ותקליטנים");
    expect(secs).toContain("זמר/ת לאירוע");
    expect(secs.indexOf("DJ ותקליטנים")).toBeLessThan(
      secs.indexOf("זמר/ת לאירוע")
    );
  });
});
