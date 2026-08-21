import "server-only";

import { isProductionRuntime } from "@/lib/isProduction";
import { stripEnvQuotes } from "@/lib/emailConfig";
import {
  USER_FACING_TURNSTILE_FAILED,
  USER_FACING_TURNSTILE_MISSING,
  USER_FACING_UNAVAILABLE,
} from "@/lib/userFacingErrors";

/** זמני: דילוג על CAPTCHA עד שמפתחות Cloudflare מיושרים */
export function isTurnstileDisabled(): boolean {
  return process.env.DISABLE_TURNSTILE === "true";
}

export function isTurnstileConfigured(): boolean {
  if (isTurnstileDisabled()) return false;
  return Boolean(
    stripEnvQuotes(process.env.TURNSTILE_SECRET_KEY ?? "") &&
      stripEnvQuotes(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "")
  );
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isTurnstileDisabled()) {
    return { ok: true };
  }

  if (!isTurnstileConfigured()) {
    if (isProductionRuntime()) {
      return {
        ok: false,
        error: USER_FACING_UNAVAILABLE,
      };
    }
    return { ok: true };
  }

  const secret = stripEnvQuotes(process.env.TURNSTILE_SECRET_KEY ?? "");

  const t = token?.trim();
  if (!t) {
    return { ok: false, error: USER_FACING_TURNSTILE_MISSING };
  }

  const body = new URLSearchParams({
    secret,
    response: t,
  });
  // remoteip אופציונלי; IP שגוי מ-proxy עלול לגרום לדחייה — רק כשיש כתובת יחידה סבירה
  const ip = remoteIp?.trim();
  if (ip && /^[\d.:a-fA-F]+$/.test(ip) && !ip.includes(",")) {
    body.set("remoteip", ip);
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
      hostname?: string;
    };
    if (data.success) return { ok: true };
    console.error(
      `[turnstile] siteverify failed codes=${JSON.stringify(data["error-codes"] ?? [])} hostname=${data.hostname ?? "?"}`
    );
    return { ok: false, error: USER_FACING_TURNSTILE_FAILED };
  } catch (err) {
    console.error(
      `[turnstile] siteverify request error: ${err instanceof Error ? err.message : String(err)}`
    );
    return { ok: false, error: USER_FACING_TURNSTILE_FAILED };
  }
}
