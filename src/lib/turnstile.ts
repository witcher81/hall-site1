import "server-only";

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true };
    }
    return { ok: false, error: "CAPTCHA לא מוגדר בשרת" };
  }

  const t = token?.trim();
  if (!t) {
    return { ok: false, error: "נא לאשר את אימות האבטחה (CAPTCHA)" };
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
    return { ok: false, error: "אימות CAPTCHA נכשל — נסו שוב" };
  } catch {
    return { ok: false, error: "שגיאה באימות CAPTCHA" };
  }
}

export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  );
}
