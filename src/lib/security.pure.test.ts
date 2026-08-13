import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/escapeHtml";
import {
  sanitizeHttpUrlForHref,
  sanitizeInternalAppHref,
} from "@/lib/safeHref";
import { isSameOriginApiRequest } from "@/lib/sameOriginGuard";
import {
  buildIsraeliPhone,
  isValidIsraeliMobilePhone,
  normalizeIsraeliPhoneDigits,
} from "@/lib/israeliPhone";
import {
  validateEmail,
  validateGuestCount,
  validateImageMagicBytes,
  validateIsraeliPhoneRegister,
  validateNewPassword,
  validateRequiredText,
  validateUploadedImageFile,
} from "@/lib/userInputValidation";
import { publicPackageWhere } from "@/lib/listingModerationTypes";
import { secretsEqual } from "@/lib/timingSafeSecret";
import { safeInternalPath, checkoutAuthHref } from "@/lib/guestCheckout";

function mockReq(headers: Record<string, string>) {
  return {
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? headers[k] ?? null,
    },
  } as Parameters<typeof isSameOriginApiRequest>[0];
}

describe("escapeHtml", () => {
  it("escapes dangerous characters", () => {
    expect(escapeHtml(`<script>"x"&'y'</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;"
    );
  });
});

describe("safeHref", () => {
  it("allows internal paths and blocks javascript / protocol-relative", () => {
    expect(sanitizeInternalAppHref("/halls/1")).toBe("/halls/1");
    expect(sanitizeInternalAppHref("javascript:alert(1)")).toBeNull();
    expect(sanitizeInternalAppHref("//evil.com")).toBeNull();
    expect(sanitizeInternalAppHref("https://x.com")).toBeNull();
  });

  it("allows only http/https external urls", () => {
    expect(sanitizeHttpUrlForHref("https://example.com/a")).toContain(
      "https://example.com"
    );
    expect(sanitizeHttpUrlForHref("javascript:alert(1)")).toBeNull();
    expect(sanitizeHttpUrlForHref("ftp://x.com")).toBeNull();
  });
});

describe("sameOriginGuard", () => {
  it("allows localhost in non-production", () => {
    expect(
      isSameOriginApiRequest(mockReq({ host: "localhost:3000" }))
    ).toBe(true);
  });

  it("matches Origin hostname to Host in production-like headers", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      expect(
        isSameOriginApiRequest(
          mockReq({
            host: "hall.example",
            origin: "https://hall.example",
          })
        )
      ).toBe(true);
      expect(
        isSameOriginApiRequest(
          mockReq({
            host: "hall.example",
            origin: "https://evil.com",
          })
        )
      ).toBe(false);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});

describe("israeliPhone", () => {
  it("validates mobile numbers with 050–059 + 7 digits", () => {
    expect(normalizeIsraeliPhoneDigits("050-123-4567")).toBe("0501234567");
    expect(isValidIsraeliMobilePhone("0501234567")).toBe(true);
    expect(isValidIsraeliMobilePhone("0401234567")).toBe(false);
    expect(buildIsraeliPhone("052", "123456789")).toBe("0521234567");
  });
});

describe("userInputValidation", () => {
  it("validates email and password rules", () => {
    expect(validateEmail("  A@B.com ").ok).toBe(true);
    expect(validateEmail("bad").ok).toBe(false);
    expect(validateNewPassword("12345").ok).toBe(false);
    expect(validateNewPassword("123456").ok).toBe(true);
  });

  it("validates Israeli phone registration fields", () => {
    expect(validateIsraeliPhoneRegister("050", "1234567").ok).toBe(true);
    expect(validateIsraeliPhoneRegister("040", "1234567").ok).toBe(false);
  });

  it("validates guest count and required text", () => {
    expect(validateGuestCount(100)).toBe(true);
    expect(validateGuestCount(0)).toBe(false);
    expect(validateRequiredText("hi", 10, 2, "שם").ok).toBe(true);
    expect(validateRequiredText("x", 10, 2, "שם").ok).toBe(false);
  });
});

describe("image upload validation", () => {
  it("requires both MIME and extension", () => {
    const bytes = new Uint8Array(32);
    expect(
      validateUploadedImageFile(
        new File([bytes], "photo.jpg", { type: "image/jpeg" })
      )
    ).toBeNull();
    expect(
      validateUploadedImageFile(
        new File([bytes], "photo", { type: "image/jpeg" })
      )
    ).not.toBeNull();
    expect(
      validateUploadedImageFile(
        new File([bytes], "photo.jpg", { type: "application/octet-stream" })
      )
    ).not.toBeNull();
  });

  it("accepts JPEG PNG WebP magic bytes and rejects others", () => {
    const jpeg = new Uint8Array(12);
    jpeg[0] = 0xff;
    jpeg[1] = 0xd8;
    jpeg[2] = 0xff;
    expect(validateImageMagicBytes(jpeg)).toBeNull();

    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    expect(validateImageMagicBytes(png)).toBeNull();

    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(validateImageMagicBytes(webp)).toBeNull();

    expect(validateImageMagicBytes(new Uint8Array(12))).not.toBeNull();
    expect(validateImageMagicBytes(new Uint8Array(4))).not.toBeNull();
  });
});

describe("publicPackageWhere", () => {
  it("requires published package and approved venue", () => {
    expect(publicPackageWhere()).toEqual({
      isPublished: true,
      venue: { moderationStatus: "APPROVED" },
    });
  });
});

describe("secretsEqual", () => {
  it("matches equal secrets and rejects mismatches", () => {
    expect(secretsEqual("abc", "abc")).toBe(true);
    expect(secretsEqual("abc", "abd")).toBe(false);
    expect(secretsEqual("ab", "abc")).toBe(false);
    expect(secretsEqual(null, "abc")).toBe(false);
    expect(secretsEqual("", "abc")).toBe(false);
  });
});

describe("guestCheckout path helpers", () => {
  it("safeInternalPath and checkoutAuthHref", () => {
    expect(safeInternalPath("/x")).toBe("/x");
    expect(safeInternalPath("//x")).toBeNull();
    expect(checkoutAuthHref("/halls/1", "login")).toContain("login");
    expect(checkoutAuthHref("/halls/1")).toContain("register");
  });
});
