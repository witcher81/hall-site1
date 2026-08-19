import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isEmailVerifyCodeFallbackActive,
  shouldExposeVerificationCodeOnFailure,
  userFacingEmailSendError,
} from "@/lib/emailConfig";
import { USER_FACING_EMAIL_FAILED } from "@/lib/userFacingErrors";

describe("email verify / reset fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not expose without an error code", () => {
    expect(shouldExposeVerificationCodeOnFailure(undefined)).toBe(false);
  });

  it("exposes codes outside production", () => {
    vi.stubEnv("VERCEL_ENV", "development");
    expect(shouldExposeVerificationCodeOnFailure("missing_api_key")).toBe(true);
    expect(isEmailVerifyCodeFallbackActive()).toBe(true);
  });

  it("does not expose in production by default", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("ENABLE_EMAIL_VERIFY_CODE_FALLBACK", "");
    vi.stubEnv("DISABLE_EMAIL_VERIFY_CODE_FALLBACK", "");
    expect(shouldExposeVerificationCodeOnFailure("missing_api_key")).toBe(false);
    expect(isEmailVerifyCodeFallbackActive()).toBe(false);
  });

  it("exposes in production only when ENABLE is set", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("ENABLE_EMAIL_VERIFY_CODE_FALLBACK", "true");
    vi.stubEnv("DISABLE_EMAIL_VERIFY_CODE_FALLBACK", "");
    expect(shouldExposeVerificationCodeOnFailure("from_not_verified")).toBe(
      true
    );
    expect(isEmailVerifyCodeFallbackActive()).toBe(true);
  });

  it("DISABLE blocks even when ENABLE is set", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("ENABLE_EMAIL_VERIFY_CODE_FALLBACK", "true");
    vi.stubEnv("DISABLE_EMAIL_VERIFY_CODE_FALLBACK", "true");
    expect(shouldExposeVerificationCodeOnFailure("missing_api_key")).toBe(false);
    expect(isEmailVerifyCodeFallbackActive()).toBe(false);
  });

  it("hides env-var names from visitors in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(userFacingEmailSendError("missing_api_key")).toBe(
      USER_FACING_EMAIL_FAILED
    );
    expect(userFacingEmailSendError("from_not_verified")).toBe(
      USER_FACING_EMAIL_FAILED
    );
  });
});
