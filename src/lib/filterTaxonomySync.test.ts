import { describe, expect, it } from "vitest";
import { resolveProviderCategoryFilter } from "@/lib/serviceCategoryQuery";
import { softAttrFiltersForEventType } from "@/lib/eventTypeSearchFilters";
import { HOME_MARKETPLACE_CATEGORIES } from "@/lib/homeCategories";

describe("resolveProviderCategoryFilter aliases", () => {
  it("maps legacy transport primary to staffing", () => {
    expect(resolveProviderCategoryFilter("הסעות")).toEqual({
      primary: "צוותים ותפעול לאירוע",
      secondary: "הסעות אורחים",
    });
    expect(resolveProviderCategoryFilter("לימוזינה")).toEqual({
      primary: "צוותים ותפעול לאירוע",
      secondary: "השכרת לימוזינה",
    });
  });

  it("expands partial secondaries to catalog names", () => {
    expect(
      resolveProviderCategoryFilter("מוזיקה ובמה", "DJ")
    ).toEqual({
      primary: "מוזיקה ובמה",
      secondary: "DJ ותקליטנים",
    });
    expect(
      resolveProviderCategoryFilter("צילום ותיעוד", "מגנט")
    ).toEqual({
      primary: "צילום ותיעוד",
      secondary: "צלם מגנטים",
    });
  });

  it("maps proposal label to planning secondary", () => {
    expect(resolveProviderCategoryFilter("הצעות נישואין")).toEqual({
      primary: "תכנון וניהול אירוע",
      secondary: "הצעות נישואין",
    });
  });

  it("drops broad catering secondary so primary search works", () => {
    expect(
      resolveProviderCategoryFilter("אוכל ומשקאות", "קייטרינג")
    ).toEqual({
      primary: "אוכל ומשקאות",
      secondary: "",
    });
  });
});

describe("home marketplace category links", () => {
  it("uses exact secondary taxonomy values", () => {
    const byId = Object.fromEntries(
      HOME_MARKETPLACE_CATEGORIES.map((c) => [c.id, c.href])
    );
    expect(byId.dj).toContain(encodeURIComponent("DJ ותקליטנים"));
    expect(byId.bar).toContain(encodeURIComponent("צוותים ותפעול לאירוע"));
    expect(byId.bar).toContain(encodeURIComponent("ברמנים"));
    expect(byId.magnet).toContain(encodeURIComponent("צלם מגנטים"));
    expect(byId.singer).toContain(encodeURIComponent("זמר/ת לאירוע"));
    expect(byId.proposals).toContain(encodeURIComponent("הצעות נישואין"));
    expect(byId.catering).not.toContain("secondary=");
  });
});

describe("softAttrFiltersForEventType", () => {
  it("returns dedicated options for business and conference", () => {
    expect(softAttrFiltersForEventType("אירוע עסקי").length).toBeGreaterThan(0);
    expect(softAttrFiltersForEventType("כנס").length).toBeGreaterThan(0);
    expect(softAttrFiltersForEventType("מסיבת סיום").length).toBeGreaterThan(0);
  });

  it("does not fall back to bar/bat filters for unknown events", () => {
    expect(softAttrFiltersForEventType("")).toEqual([]);
  });
});
