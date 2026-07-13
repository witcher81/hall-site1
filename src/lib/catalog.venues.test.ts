import { describe, expect, it } from "vitest";
import {
  getCatalogTemplate,
  resolveCatalogTemplateFromCategory,
  resolveCatalogTemplateId,
  catalogReplacesIncludesEditor,
} from "@/lib/serviceCategoryTemplates";
import {
  sanitizeServiceMenuFromClient,
  validateServiceMenuForSubmit,
  formatMenuItemPrice,
  menuHasContent,
} from "@/lib/serviceMenu";
import { parseNaturalHallSearchQuery } from "@/lib/naturalHallSearch";
import { EVENT_TYPE_BACHELOR } from "@/lib/eventTypeOptions";
import {
  offerProductKeysForEventType,
  eventQuickChipsForEventType,
} from "@/lib/eventTypeSearchFilters";
import {
  coerceParkingKindFromStorage,
  resolveParkingFilterFromSearchParams,
} from "@/lib/venueParkingKind";
import {
  parseKashrutHintFromText,
  validateVenueKashrut,
} from "@/lib/venueKashrutOptions";
import {
  buildMinMaxStringsForSubmit,
  formatFreelancerServicePriceShekelCompact,
  parseMinMaxToFreelancerPriceForm,
} from "@/lib/freelancerServicePriceForm";

describe("serviceCategoryTemplates resolve", () => {
  it("resolves beverage for cocktail bar category", () => {
    const t = resolveCatalogTemplateFromCategory(
      "אוכל ומשקאות / בר קוקטיילים"
    );
    expect(t?.id).toBe("beverage");
    expect(catalogReplacesIncludesEditor("beverage")).toBe(true);
    expect(catalogReplacesIncludesEditor("ceremony")).toBe(false);
  });

  it("falls back staffing for teams primary", () => {
    expect(resolveCatalogTemplateId("צוותים ותפעול לאירוע", [])).toBe(
      "staffing"
    );
    expect(getCatalogTemplate("food").packagePriceLabel).toContain("לאורח");
  });
});

describe("serviceMenu sanitize/validate", () => {
  it("sanitizes menu and requires packages or items", () => {
    const empty = sanitizeServiceMenuFromClient({});
    expect(validateServiceMenuForSubmit(empty)).toBeTruthy();

    const ok = sanitizeServiceMenuFromClient({
      templateId: "food",
      minGuests: 50,
      maxGuests: 200,
      packages: [{ name: "מבוגרים", perGuestPrice: 180 }],
    });
    expect(ok.packages[0]?.perGuestPrice).toBe(180);
    expect(
      validateServiceMenuForSubmit(ok, getCatalogTemplate("food"))
    ).toBeNull();
    expect(menuHasContent(ok)).toBe(true);
  });

  it("aliases activation templateId to attraction", () => {
    const m = sanitizeServiceMenuFromClient({ templateId: "activation" });
    expect(m.templateId).toBe("attraction");
  });

  it("formats menu item prices", () => {
    expect(
      formatMenuItemPrice({
        id: "1",
        label: "x",
        pricing: "included",
      })
    ).toBe("כלול בחבילה");
    expect(
      formatMenuItemPrice({
        id: "1",
        label: "x",
        pricing: "per_guest",
        exactPrice: 30,
      })
    ).toBe("₪30 לאורח");
  });
});

describe("naturalHallSearch + event filters", () => {
  it("parses bachelor and city from free text", () => {
    const h = parseNaturalHallSearchQuery("מסיבת רווקים בתל אביב ל-80 אורחים");
    expect(h.eventType).toBe(EVENT_TYPE_BACHELOR);
    expect(h.city).toBe("תל אביב");
    expect(h.minGuests).toBe("80");
  });

  it("exposes bachelor quick chips and products", () => {
    expect(offerProductKeysForEventType(EVENT_TYPE_BACHELOR)?.length).toBeGreaterThan(
      0
    );
    expect(eventQuickChipsForEventType(EVENT_TYPE_BACHELOR).length).toBeGreaterThan(
      0
    );
  });
});

describe("venue parking + kashrut", () => {
  it("coerces legacy parking kinds", () => {
    expect(coerceParkingKindFromStorage("paid_lot")).toBe("nearby");
    expect(resolveParkingFilterFromSearchParams(null, "חניה צמודה")).toBe(
      "adjacent"
    );
  });

  it("validates kashrut and parses hints", () => {
    expect(validateVenueKashrut("מהדרין").ok).toBe(true);
    expect(validateVenueKashrut("משהו").ok).toBe(false);
    expect(parseKashrutHintFromText("ללא כשרות")).toBe("ללא");
  });
});

describe("freelancerServicePriceForm", () => {
  it("round-trips exact vs range", () => {
    expect(parseMinMaxToFreelancerPriceForm(100, 100).priceUseRange).toBe(false);
    expect(parseMinMaxToFreelancerPriceForm(100, 200).priceUseRange).toBe(true);
    expect(
      buildMinMaxStringsForSubmit({
        priceUseRange: false,
        exactPrice: "150",
        minPrice: "",
        maxPrice: "",
      })
    ).toEqual({ minPrice: "150", maxPrice: "150" });
    expect(formatFreelancerServicePriceShekelCompact(100, 100)).toBe("₪ 100");
  });
});
