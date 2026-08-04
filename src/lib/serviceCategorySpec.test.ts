import { describe, expect, it } from "vitest";
import {
  buildSecondaryTemplateMap,
  LEGACY_CATALOG_TEMPLATE_ALIASES,
  normalizeCatalogTemplateId,
  SECONDARY_TEMPLATE_OVERRIDE,
} from "@/lib/serviceCategorySpec";
import { FREELANCER_CATEGORY_GROUPS } from "@/lib/freelancerServiceCategories";

describe("serviceCategorySpec", () => {
  it("maps all secondaries (128)", () => {
    const map = buildSecondaryTemplateMap();
    const count = FREELANCER_CATEGORY_GROUPS.reduce(
      (sum, g) => sum + g.services.length,
      0
    );
    expect(count).toBe(128);
    expect(Object.keys(map)).toHaveLength(128);
  });

  it("maps marriage proposals to planning template", () => {
    const map = buildSecondaryTemplateMap();
    expect(map["הצעות נישואין"]).toBe("planning");
  });

  it("customizes marriage proposal catalog copy", async () => {
    const { resolveCatalogTemplateFromCategory } = await import(
      "@/lib/serviceCategoryTemplates"
    );
    const { getCatalogFieldHelp } = await import("@/lib/catalogFieldHelp");
    const t = resolveCatalogTemplateFromCategory(
      "תכנון וניהול אירוע / הצעות נישואין"
    );
    expect(t?.id).toBe("planning");
    expect(t?.editorTitle).toContain("הצעות נישואין");
    expect(t?.packageIncludedTitle).toContain("הצעה");
    expect(t?.catalogTitle).toContain("תוספות");
    expect(t?.showPackageDuration).toBe(true);
    expect(t?.requireGuestCountInquiry).toBe(false);
    expect(t?.packagesStepLabel).toContain("הצעה");
    const help = getCatalogFieldHelp("planning", "הצעות נישואין");
    expect(help.packagesSectionTitle).toContain("חבילת הצעה");
    expect(help.addPackageButton).toContain("הצעה");
  });

  it("maps bars to beverage and stations to food_station", () => {
    expect(SECONDARY_TEMPLATE_OVERRIDE["בר קוקטיילים"]).toBe("beverage");
    expect(SECONDARY_TEMPLATE_OVERRIDE["עמדת גלידה"]).toBe("food_station");
    expect(SECONDARY_TEMPLATE_OVERRIDE["שולחן שוק"]).toBe("food_station");
    expect(SECONDARY_TEMPLATE_OVERRIDE["שירות אישורי הגעה והושבה"]).toBe(
      "registration"
    );
  });

  it("remaps ops to staffing, cakes to food_station, doves to attraction", () => {
    expect(SECONDARY_TEMPLATE_OVERRIDE["אבטחה וסדרנות"]).toBe("staffing");
    expect(SECONDARY_TEMPLATE_OVERRIDE["ניקיון לפני/במהלך/אחרי"]).toBe("staffing");
    expect(SECONDARY_TEMPLATE_OVERRIDE["חובש/פראמדיק לאירוע"]).toBe("staffing");
    expect(SECONDARY_TEMPLATE_OVERRIDE["משגיח כשרות לאירוע"]).toBe("staffing");
    expect(SECONDARY_TEMPLATE_OVERRIDE["צוות הקמה ופירוק"]).toBe("staffing");
    expect(SECONDARY_TEMPLATE_OVERRIDE["עוגות לאירועים"]).toBe("food_station");
    expect(SECONDARY_TEMPLATE_OVERRIDE["הפרחת יונים או פרפרים"]).toBe("attraction");
  });

  it("leaves generic only for אחר primary secondaries", () => {
    const map = buildSecondaryTemplateMap();
    const generics = Object.entries(map).filter(([, id]) => id === "generic");
    expect(generics.length).toBeGreaterThanOrEqual(1);
    expect(generics.every(([name]) => name === "שירות אחר" || name.includes("אחר"))).toBe(
      true
    );
  });

  it("aliases legacy activation template to attraction", () => {
    expect(normalizeCatalogTemplateId("activation")).toBe("attraction");
    expect(LEGACY_CATALOG_TEMPLATE_ALIASES.activation).toBe("attraction");
  });
});
