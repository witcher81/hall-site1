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
  validateIsraeliPhoneRegister,
  validateNewPassword,
  validateRequiredText,
} from "@/lib/userInputValidation";
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

describe("guestCheckout path helpers", () => {
  it("safeInternalPath and checkoutAuthHref", () => {
    expect(safeInternalPath("/x")).toBe("/x");
    expect(safeInternalPath("//x")).toBeNull();
    expect(checkoutAuthHref("/halls/1", "login")).toContain("login");
    expect(checkoutAuthHref("/halls/1")).toContain("register");
  });
});
