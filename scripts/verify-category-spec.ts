/**
 * QA: וידוא מיפוי 131 תתי־קטגוריות, כל תבנית, ו-alias ישנים.
 * הרצה: npx tsx scripts/verify-category-spec.ts
 */
import {
  buildSecondaryTemplateMap,
  LEGACY_CATALOG_TEMPLATE_ALIASES,
  LEGACY_SECONDARY_ALIASES,
  verifyServiceCategorySpec,
  type CatalogTemplateId,
} from "../src/lib/serviceCategorySpec";
import { getCatalogTemplate } from "../src/lib/serviceCategoryTemplates";

verifyServiceCategorySpec();

const map = buildSecondaryTemplateMap();
const templateIds = new Set<CatalogTemplateId>(Object.values(map));

for (const id of templateIds) {
  getCatalogTemplate(id);
}

for (const id of Object.values(LEGACY_CATALOG_TEMPLATE_ALIASES)) {
  getCatalogTemplate(id);
}

for (const current of Object.values(LEGACY_SECONDARY_ALIASES)) {
  if (!map[current]) {
    throw new Error(`Legacy secondary alias target missing from map: ${current}`);
  }
}

const expectedTemplates: CatalogTemplateId[] = [
  "food",
  "beverage",
  "food_station",
  "registration",
  "staffing",
  "beauty",
  "fashion_rental",
  "print_quantity",
  "photo_video",
  "music",
  "tech_av",
  "equipment_rental",
  "attraction",
  "planning",
  "ceremony",
  "design",
  "transport",
  "corporate",
  "generic",
];

for (const id of expectedTemplates) {
  getCatalogTemplate(id);
}

console.log(
  `OK: ${Object.keys(map).length} secondaries → ${templateIds.size} templates (+ legacy aliases)`
);
