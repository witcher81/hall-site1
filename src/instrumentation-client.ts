import * as Sentry from "@sentry/nextjs";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/cookieConsent";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
let sentryInitialized = false;

function initSentryIfAllowed() {
  if (sentryInitialized || !dsn || !hasAnalyticsConsent()) return;
  sentryInitialized = true;
  Sentry.init({
    dsn,
    enabled: true,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    sendDefaultPii: false,
    enableLogs: true,
  });
}

initSentryIfAllowed();

if (typeof window !== "undefined") {
  window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, () => {
    initSentryIfAllowed();
  });
}

export function onRouterTransitionStart(...args: Parameters<typeof Sentry.captureRouterTransitionStart>) {
  if (!sentryInitialized) return;
  return Sentry.captureRouterTransitionStart(...args);
}
