import { isProductionRuntime } from "@/lib/isProduction";

export function isTurnstilePublicKeySet(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

/** בפרוד בלי מפתח ציבורי — לא מציגים טופס שעובד ואז נכשל */
export function isTurnstileUnavailable(): boolean {
  return isProductionRuntime() && !isTurnstilePublicKeySet();
}

export function isCaptchaSubmitReady(token: string): boolean {
  if (isTurnstileUnavailable()) return false;
  if (isTurnstilePublicKeySet()) return Boolean(token.trim());
  return true;
}
