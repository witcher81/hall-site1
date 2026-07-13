import { describe, expect, it } from "vitest";
import {
  catalogPackageUsesPerGuestMultiplier,
  formatPackagePrice,
} from "@/lib/serviceMenu";
import type { CatalogTemplate } from "@/lib/serviceCategoryTemplates";

function fakeTemplate(packagePriceLabel: string): CatalogTemplate {
  return { packagePriceLabel } as CatalogTemplate;
}

describe("serviceMenu pricing helpers", () => {
  it("multiplies by guest count only when label is per-guest style", () => {
    expect(
      catalogPackageUsesPerGuestMultiplier(fakeTemplate("מחיר לאורח (₪)"))
    ).toBe(true);
    expect(
      catalogPackageUsesPerGuestMultiplier(fakeTemplate("מחיר לשירות (₪)"))
    ).toBe(false);
    expect(
      catalogPackageUsesPerGuestMultiplier(fakeTemplate("מחיר לנסיעה / לערב (₪)"))
    ).toBe(false);
  });

  it("formats fixed package price without לאורח suffix", () => {
    expect(
      formatPackagePrice(
        { id: "1", name: "בר", perGuestPrice: 3500 },
        { perGuestSuffix: false }
      )
    ).toBe("₪3500");
  });

  it("formats per-guest package price with לאורח suffix", () => {
    expect(
      formatPackagePrice(
        { id: "1", name: "תפריט", perGuestPrice: 180 },
        { perGuestSuffix: true }
      )
    ).toBe("₪180 לאורח");
  });
});
