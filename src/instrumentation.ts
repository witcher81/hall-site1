import * as Sentry from "@sentry/nextjs";

/**
 * רץ בעת אתחול runtime — בדיקת env + Sentry (שרת/Edge).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertNoSecretExposedAsPublicEnv } = await import("./lib/env.server");
    const {
      warnIfProductionMissingCronSecret,
      warnIfProductionMissingUpstash,
      warnIfProductionDevUserSwitch,
    } = await import("./lib/rateLimit");
    assertNoSecretExposedAsPublicEnv();
    warnIfProductionMissingUpstash();
    warnIfProductionMissingCronSecret();
    warnIfProductionDevUserSwitch();
    if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
      await import("./sentry.server.config");
    }
  }
  if (process.env.NEXT_RUNTIME === "edge" && process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
    await import("./sentry.edge.config");
  }
}

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

/** מעקב אחר שגיאות ב-Server Components / middleware (דורש NEXT_PUBLIC_SENTRY_DSN) */
export const onRequestError = sentryDsn ? Sentry.captureRequestError : undefined;
