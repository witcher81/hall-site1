import { describe, expect, it } from "vitest";
import {
  isKnownVenueType,
  parseVenueTypeFromForm,
  VENUE_TYPE_OPTIONS,
} from "@/lib/venueTypeOptions";

describe("venueTypeOptions", () => {
  it("includes Airbnb, synagogue, and cabin types", () => {
    const values = VENUE_TYPE_OPTIONS.map((o) => o.value);
    expect(values).toContain("דירת Airbnb");
    expect(values).toContain("בית כנסת כאולם");
    expect(values).toContain("צימר");
  });

  it("accepts known types and rejects empty", () => {
    expect(isKnownVenueType("צימר")).toBe(true);
    expect(parseVenueTypeFromForm("").error).toBeTruthy();
    expect(parseVenueTypeFromForm("צימר")).toEqual({
      value: "צימר",
      error: null,
    });
  });
});
