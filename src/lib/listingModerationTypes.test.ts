import { describe, expect, it } from "vitest";
import {
  approvedListingWhere,
  isListingPubliclyVisible,
  ListingModerationStatus,
  ListingModerationSource,
} from "@/lib/listingModerationTypes";

describe("listingModerationTypes", () => {
  it("treats only APPROVED listings as publicly visible", () => {
    expect(isListingPubliclyVisible(ListingModerationStatus.APPROVED)).toBe(true);
    expect(isListingPubliclyVisible(ListingModerationStatus.PENDING)).toBe(false);
    expect(isListingPubliclyVisible(ListingModerationStatus.REJECTED)).toBe(false);
    expect(isListingPubliclyVisible(null)).toBe(false);
  });

  it("builds Prisma filter for approved listings", () => {
    expect(approvedListingWhere()).toEqual({
      moderationStatus: ListingModerationStatus.APPROVED,
    });
  });

  it("exposes API/AUTO sources for autonomous moderation", () => {
    expect(ListingModerationSource.API).toBe("API");
    expect(ListingModerationSource.AUTO).toBe("AUTO");
  });
});
