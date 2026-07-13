import { describe, expect, it } from "vitest";
import {
  buildSecondaryTemplateMap,
  LEGACY_CATALOG_TEMPLATE_ALIASES,
  normalizeCatalogTemplateId,
  SECONDARY_TEMPLATE_OVERRIDE,
} from "@/lib/serviceCategorySpec";
import { FREELANCER_CATEGORY_GROUPS } from "@/lib/freelancerServiceCategories";

describe("serviceCategorySpec", () => {
  it("maps all secondaries (127)", () => {
    const map = buildSecondaryTemplateMap();
    const count = FREELANCER_CATEGORY_GROUPS.reduce(
      (sum, g) => sum + g.services.length,
      0
    );
    expect(count).toBe(127);
    expect(Object.keys(map)).toHaveLength(127);
  });

  it("maps bars to beverage and stations to food_station", () => {
    expect(SECONDARY_TEMPLATE_OVERRIDE["בר קוקטיילים"]).toBe("beverage");
    expect(SECONDARY_TEMPLATE_OVERRIDE["עמדת גלידה"]).toBe("food_station");
    expect(SECONDARY_TEMPLATE_OVERRIDE["שירות אישורי הגעה והושבה"]).toBe(
      "registration"
    );
  });

  it("aliases legacy activation template to attraction", () => {
    expect(normalizeCatalogTemplateId("activation")).toBe("attraction");
    expect(LEGACY_CATALOG_TEMPLATE_ALIASES.activation).toBe("attraction");
  });
});
