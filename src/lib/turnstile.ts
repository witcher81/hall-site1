import "server-only";

import { isProductionRuntime } from "@/lib/isProduction";
import {
  USER_FACING_TURNSTILE_FAILED,
  USER_FACING_TURNSTILE_MISSING,
  USER_FACING_UNAVAILABLE,
} from "@/lib/userFacingErrors";

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isTurnstileConfigured()) {
    if (isProductionRuntime()) {
      return {
        ok: false,
        error: USER_FACING_UNAVAILABLE,
      };
    }
    return { ok: true };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY!.trim();

  const t = token?.trim();
  if (!t) {
    return { ok: false, error: USER_FACING_TURNSTILE_MISSING };
  }

  const body = new URLSearchParams({
    secret,
    response: t,
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    const data = (await res.json()) as { success?: boolean };
    if (data.success) return { ok: true };
    return { ok: false, error: USER_FACING_TURNSTILE_FAILED };
  } catch {
    return { ok: false, error: USER_FACING_TURNSTILE_FAILED };
  }
}

export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  );
}
