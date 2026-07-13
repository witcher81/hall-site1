import { describe, expect, it } from "vitest";
import {
  EVENT_TYPE_BACHELOR,
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BRIT,
  eventTypeSearchContainsVariants,
  normalizeEventTypeLabel,
  STANDARD_EVENT_TYPE_OPTIONS,
} from "@/lib/eventTypeOptions";

describe("eventTypeOptions", () => {
  it("includes bachelor party in the standard options", () => {
    expect(STANDARD_EVENT_TYPE_OPTIONS).toContain(EVENT_TYPE_BACHELOR);
  });

  it("normalizes legacy bachelor labels", () => {
    expect(normalizeEventTypeLabel("מסיבת רווקים")).toBe(EVENT_TYPE_BACHELOR);
    expect(normalizeEventTypeLabel("רווקות")).toBe(EVENT_TYPE_BACHELOR);
  });

  it("normalizes bar/bat and brit legacy labels", () => {
    expect(normalizeEventTypeLabel("בר מצווה")).toBe(EVENT_TYPE_BAR_BAT);
    expect(normalizeEventTypeLabel("בריתה")).toBe(EVENT_TYPE_BRIT);
  });

  it("returns search variants for bachelor party", () => {
    const variants = eventTypeSearchContainsVariants(EVENT_TYPE_BACHELOR);
    expect(variants).toContain(EVENT_TYPE_BACHELOR);
    expect(variants).toContain("מסיבת רווקים");
  });
});
