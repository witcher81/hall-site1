import { describe, expect, it } from "vitest";
import {
  canOwnerApprove,
  canSeekerCancel,
  isInquiryRejectedOrCancelled,
  isTerminalInquiryStatus,
  normalizeInquiryStatus,
  inquiryPreferredDateToUtc,
} from "@/lib/inquiryStatus";
import {
  isServiceRequestCancelled,
  serviceRequestStatusLabel,
} from "@/lib/serviceRequestStatus";
import {
  composeServiceCategoryValue,
  parseServiceCategorySelections,
  FREELANCER_CATEGORY_GROUPS,
} from "@/lib/freelancerServiceCategories";
import { socialLinkDisplayLabel, normalizeSocialUrl } from "@/lib/socialLinks";

describe("inquiryStatus", () => {
  it("normalizes and classifies statuses", () => {
    expect(normalizeInquiryStatus("approved")).toBe("APPROVED");
    expect(normalizeInquiryStatus("nope")).toBe("NEW");
    expect(isTerminalInquiryStatus("REJECTED")).toBe(true);
    expect(canOwnerApprove("NEW")).toBe(true);
    expect(canOwnerApprove("APPROVED")).toBe(false);
    expect(canSeekerCancel("NEW")).toBe(true);
    expect(isInquiryRejectedOrCancelled("CANCELLED")).toBe(true);
  });

  it("parses preferred date to UTC", () => {
    expect(inquiryPreferredDateToUtc("2026-08-01")?.toISOString()).toBe(
      "2026-08-01T00:00:00.000Z"
    );
    expect(inquiryPreferredDateToUtc("bad")).toBeNull();
  });
});

describe("serviceRequestStatus", () => {
  it("reflects inquiry cancellation", () => {
    expect(isServiceRequestCancelled("NEW", "CANCELLED")).toBe(true);
    expect(serviceRequestStatusLabel("NEW")).toBe("חדשה");
    expect(serviceRequestStatusLabel("CANCELLED")).toBe("ביטלת השתתפות");
  });
});

describe("freelancerServiceCategories", () => {
  it("composes and parses multi-secondary values", () => {
    const v = composeServiceCategoryValue("אוכל ומשקאות", [
      "בר קוקטיילים",
      "בר קפה",
    ]);
    const parsed = parseServiceCategorySelections(v);
    expect(parsed.primary).toBe("אוכל ומשקאות");
    expect(parsed.secondaries).toEqual(["בר קוקטיילים", "בר קפה"]);
    expect(FREELANCER_CATEGORY_GROUPS.length).toBe(14);
  });
});

describe("socialLinks helpers", () => {
  it("normalizes http urls when possible", () => {
    const n = normalizeSocialUrl("https://instagram.com/x");
    expect(n === null || n.startsWith("https://")).toBe(true);
    expect(
      socialLinkDisplayLabel({ platform: "instagram", url: n ?? "https://instagram.com/x" })
    ).toBeTruthy();
  });
});
