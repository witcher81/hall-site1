import { describe, expect, it } from "vitest";
import {
  assertCanCreateExactQuote,
  buildNegotiationPricingFlags,
  countProviderQuotes,
  getCatalogPricingMode,
  isExactQuoteWithinCatalog,
  isFixedCatalogPrice,
  isRangeCatalogPrice,
  maxProviderQuotesAllowed,
  mergeCatalogPricingModes,
  resolveServiceCatalogPricing,
  resolveVenueThreadCatalogPricing,
} from "@/lib/catalogPricingMode";

describe("getCatalogPricingMode", () => {
  it("detects fixed, range, and unset", () => {
    expect(getCatalogPricingMode(100, 100)).toBe("fixed");
    expect(getCatalogPricingMode(100, null)).toBe("fixed");
    expect(getCatalogPricingMode(100, 200)).toBe("range");
    expect(getCatalogPricingMode(null, null)).toBe("unset");
    expect(isFixedCatalogPrice(50, 50)).toBe(true);
    expect(isRangeCatalogPrice(50, 80)).toBe(true);
  });

  it("merges modes with range winning", () => {
    expect(mergeCatalogPricingModes(["fixed", "fixed"])).toBe("fixed");
    expect(mergeCatalogPricingModes(["fixed", "range"])).toBe("range");
    expect(mergeCatalogPricingModes(["unset", "unset"])).toBe("unset");
    expect(mergeCatalogPricingModes(["unset", "fixed"])).toBe("fixed");
  });
});

describe("resolveServiceCatalogPricing", () => {
  it("returns exact amount for fixed service price", () => {
    expect(resolveServiceCatalogPricing(1200, 1200)).toEqual({
      pricingMode: "fixed",
      catalogMin: 1200,
      catalogMax: 1200,
      exactAmount: 1200,
    });
  });

  it("returns range without exact amount", () => {
    expect(resolveServiceCatalogPricing(1000, 2000)).toEqual({
      pricingMode: "range",
      catalogMin: 1000,
      catalogMax: 2000,
      exactAmount: null,
    });
  });
});

describe("resolveVenueThreadCatalogPricing", () => {
  it("treats equal hall rental as fixed exact total", () => {
    const r = resolveVenueThreadCatalogPricing({
      hallRentalMin: 50000,
      hallRentalMax: 50000,
      venueMinPrice: null,
      venueMaxPrice: null,
      guestCount: 100,
      eventType: null,
      eventTypeProfilesJson: null,
      eventTypes: [],
      serviceChoices: [],
    });
    expect(r.pricingMode).toBe("fixed");
    expect(r.exactAmount).toBe(50000);
  });

  it("treats hall range as range even with fixed extras", () => {
    const r = resolveVenueThreadCatalogPricing({
      hallRentalMin: 40000,
      hallRentalMax: 60000,
      venueMinPrice: null,
      venueMaxPrice: null,
      guestCount: null,
      eventType: null,
      eventTypeProfilesJson: null,
      eventTypes: [],
      serviceChoices: [
        {
          id: "a",
          label: "תוספת",
          source: "venue",
          priceMode: "extra",
          extraPrice: 1000,
        },
      ],
    });
    expect(r.pricingMode).toBe("range");
    expect(r.catalogMin).toBe(41000);
    expect(r.catalogMax).toBe(61000);
    expect(r.exactAmount).toBeNull();
  });
});

describe("quote validation helpers", () => {
  it("checks amount within catalog", () => {
    expect(isExactQuoteWithinCatalog(150, 100, 200)).toBe(true);
    expect(isExactQuoteWithinCatalog(90, 100, 200)).toBe(false);
    expect(isExactQuoteWithinCatalog(250, 100, 200)).toBe(false);
    expect(isExactQuoteWithinCatalog(999, null, null)).toBe(true);
  });

  it("counts provider quotes and max after re-quote", () => {
    expect(
      countProviderQuotes([
        { authorRole: "FREELANCER", status: "PENDING" },
        { authorRole: "SEEKER", status: "PENDING" },
        { authorRole: "FREELANCER", status: "SUPERSEDED" },
        { authorRole: "FREELANCER", status: "WITHDRAWN" },
      ])
    ).toBe(2);
    expect(maxProviderQuotesAllowed(null)).toBe(1);
    expect(maxProviderQuotesAllowed(new Date())).toBe(2);
  });
});

describe("buildNegotiationPricingFlags", () => {
  it("disables offers for fixed catalog", () => {
    const flags = buildNegotiationPricingFlags({
      pricingMode: "fixed",
      catalogMin: 100,
      catalogMax: 100,
      exactAmount: 100,
      threadStatus: "OPEN",
      seekerReQuoteRequestedAt: null,
      offers: [],
      currentUserRole: "VENUE_OWNER",
      isProviderForThread: true,
    });
    expect(flags.canProviderQuote).toBe(false);
    expect(flags.canSeekerDecide).toBe(false);
    expect(flags.exactAmount).toBe(100);
  });

  it("allows provider first quote on range", () => {
    const flags = buildNegotiationPricingFlags({
      pricingMode: "range",
      catalogMin: 100,
      catalogMax: 200,
      exactAmount: null,
      threadStatus: "OPEN",
      seekerReQuoteRequestedAt: null,
      offers: [],
      currentUserRole: "FREELANCER",
      isProviderForThread: true,
    });
    expect(flags.canProviderQuote).toBe(true);
  });

  it("allows seeker decide and one re-quote when pending", () => {
    const flags = buildNegotiationPricingFlags({
      pricingMode: "range",
      catalogMin: 100,
      catalogMax: 200,
      exactAmount: null,
      threadStatus: "OPEN",
      seekerReQuoteRequestedAt: null,
      offers: [
        {
          id: 7,
          authorRole: "FREELANCER",
          authorUserId: 2,
          status: "PENDING",
        },
      ],
      currentUserRole: "SEEKER",
      isProviderForThread: false,
    });
    expect(flags.canSeekerDecide).toBe(true);
    expect(flags.canSeekerRequestReQuote).toBe(true);
    expect(flags.pendingProviderOfferId).toBe(7);
    expect(flags.canProviderQuote).toBe(false);
  });

  it("blocks second re-quote after used", () => {
    const flags = buildNegotiationPricingFlags({
      pricingMode: "range",
      catalogMin: 100,
      catalogMax: 200,
      exactAmount: null,
      threadStatus: "OPEN",
      seekerReQuoteRequestedAt: new Date().toISOString(),
      offers: [
        {
          id: 8,
          authorRole: "FREELANCER",
          authorUserId: 2,
          status: "PENDING",
        },
      ],
      currentUserRole: "SEEKER",
      isProviderForThread: false,
    });
    expect(flags.canSeekerRequestReQuote).toBe(false);
    expect(flags.reQuoteUsed).toBe(true);
  });

  it("allows re-quote after rejected first quote", () => {
    const flags = buildNegotiationPricingFlags({
      pricingMode: "range",
      catalogMin: 100,
      catalogMax: 200,
      exactAmount: null,
      threadStatus: "OPEN",
      seekerReQuoteRequestedAt: null,
      offers: [
        {
          id: 9,
          authorRole: "VENUE_OWNER",
          authorUserId: 3,
          status: "REJECTED",
        },
      ],
      currentUserRole: "SEEKER",
      isProviderForThread: false,
    });
    expect(flags.canSeekerRequestReQuote).toBe(true);
    expect(flags.canSeekerDecide).toBe(false);
  });
});

describe("assertCanCreateExactQuote", () => {
  const rangeCatalog = {
    pricingMode: "range" as const,
    catalogMin: 1000,
    catalogMax: 2000,
    exactAmount: null,
  };

  it("rejects fixed catalog offers", () => {
    const r = assertCanCreateExactQuote({
      role: "VENUE_OWNER",
      catalog: {
        pricingMode: "fixed",
        catalogMin: 1000,
        catalogMax: 1000,
        exactAmount: 1000,
      },
      threadStatus: "OPEN",
      seekerReQuoteRequestedAt: null,
      offers: [],
      amountMinNis: 1000,
      amountMaxNis: 1000,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects seeker quotes and ranges", () => {
    expect(
      assertCanCreateExactQuote({
        role: "SEEKER",
        catalog: rangeCatalog,
        threadStatus: "OPEN",
        seekerReQuoteRequestedAt: null,
        offers: [],
        amountMinNis: 1500,
        amountMaxNis: null,
      }).ok
    ).toBe(false);

    expect(
      assertCanCreateExactQuote({
        role: "FREELANCER",
        catalog: rangeCatalog,
        threadStatus: "OPEN",
        seekerReQuoteRequestedAt: null,
        offers: [],
        amountMinNis: 1200,
        amountMaxNis: 1800,
      }).ok
    ).toBe(false);
  });

  it("rejects out-of-range and second quote without re-quote", () => {
    expect(
      assertCanCreateExactQuote({
        role: "FREELANCER",
        catalog: rangeCatalog,
        threadStatus: "OPEN",
        seekerReQuoteRequestedAt: null,
        offers: [],
        amountMinNis: 500,
        amountMaxNis: null,
      }).ok
    ).toBe(false);

    expect(
      assertCanCreateExactQuote({
        role: "FREELANCER",
        catalog: rangeCatalog,
        threadStatus: "OPEN",
        seekerReQuoteRequestedAt: null,
        offers: [{ authorRole: "FREELANCER", status: "PENDING" }],
        amountMinNis: 1500,
        amountMaxNis: null,
      }).ok
    ).toBe(false);

    expect(
      assertCanCreateExactQuote({
        role: "FREELANCER",
        catalog: rangeCatalog,
        threadStatus: "OPEN",
        seekerReQuoteRequestedAt: null,
        offers: [{ authorRole: "FREELANCER", status: "SUPERSEDED" }],
        amountMinNis: 1500,
        amountMaxNis: null,
      }).ok
    ).toBe(false);
  });

  it("allows exact quote within range", () => {
    const r = assertCanCreateExactQuote({
      role: "FREELANCER",
      catalog: rangeCatalog,
      threadStatus: "OPEN",
      seekerReQuoteRequestedAt: null,
      offers: [],
      amountMinNis: 1500,
      amountMaxNis: null,
    });
    expect(r).toEqual({ ok: true, exactAmount: 1500 });
  });

  it("allows second quote after re-quote request", () => {
    const r = assertCanCreateExactQuote({
      role: "VENUE_OWNER",
      catalog: rangeCatalog,
      threadStatus: "OPEN",
      seekerReQuoteRequestedAt: new Date(),
      offers: [{ authorRole: "VENUE_OWNER", status: "SUPERSEDED" }],
      amountMinNis: 1600,
      amountMaxNis: 1600,
    });
    expect(r).toEqual({ ok: true, exactAmount: 1600 });
  });
});
