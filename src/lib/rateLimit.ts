import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isProductionRuntime } from "@/lib/isProduction";
import { getUpstashRedisConfig } from "@/lib/upstashEnv";

type LimiterKind = "api" | "auth" | "heavy" | "sensitive" | "analytics";

type LimiterSet = Record<LimiterKind, Ratelimit>;

type Cached = LimiterSet | null;

let limiters: Cached | undefined;

const AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
]);

const HEAVY_PREFIXES = [
  "/api/inquiry/deal-insights",
  "/api/inquiry/freelancer-alternatives",
  "/api/geocode/",
] as const;

const ANALYTICS_PREFIXES = ["/api/analytics/"] as const;

const LIMITER_WINDOWS: Record<LimiterKind, { limit: number; windowMs: number }> = {
  api: { limit: 100, windowMs: 60_000 },
  auth: { limit: 15, windowMs: 60_000 },
  heavy: { limit: 30, windowMs: 60_000 },
  sensitive: { limit: 5, windowMs: 60_000 },
  analytics: { limit: 20, windowMs: 3_600_000 },
};

/** גיבוי ב-Edge כשאין Upstash — מוגבל ל-instance אחד, אבל לא חוסם את האתר */
const memoryCounts = new Map<string, { count: number; resetAt: number }>();

function getLimiters(): Cached {
  if (limiters !== undefined) return limiters;
  const cfg = getUpstashRedisConfig();
  if (!cfg) {
    limiters = null;
    return null;
  }
  const redis = new Redis({ url: cfg.url, token: cfg.token });
  limiters = {
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "hall:rl:api",
    }),
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, "1 m"),
      analytics: true,
      prefix: "hall:rl:auth",
    }),
    heavy: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "hall:rl:heavy",
    }),
    sensitive: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "hall:rl:sensitive",
    }),
    analytics: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "hall:rl:analytics",
    }),
  };
  return limiters;
}

function pickLimiterKind(pathname: string): LimiterKind {
  if (AUTH_PATHS.has(pathname)) return "auth";
  if (
    pathname === "/api/venue-owner/venues/boost" ||
    pathname === "/api/venue-owner/venues/boost/checkout" ||
    pathname === "/api/settings/account" ||
    pathname === "/api/contact" ||
    pathname === "/api/privacy-request"
  ) {
    return "sensitive";
  }
  if (ANALYTICS_PREFIXES.some((p) => pathname.startsWith(p))) return "analytics";
  if (HEAVY_PREFIXES.some((p) => pathname.startsWith(p))) return "heavy";
  return "api";
}

function rateLimitKey(
  pathname: string,
  ip: string,
  kind: LimiterKind
): string {
  if (kind === "auth") return `auth:${ip}`;
  if (kind === "heavy") return `heavy:${ip}`;
  if (kind === "sensitive") return `sensitive:${ip}:${pathname}`;
  if (kind === "analytics") return `analytics:${ip}`;
  return `api:${ip}`;
}

function applyMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const entry = memoryCounts.get(key);
  if (!entry || now >= entry.resetAt) {
    memoryCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }
  entry.count += 1;
  const success = entry.count <= limit;
  return {
    success,
    limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.resetAt,
  };
}

function rateLimitHeaders(
  res: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", String(reset));
  return res;
}

export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "unknown";
}

/**
 * Rate limit לפי IP (Edge). Upstash כשמוגדר; אחרת גיבוי בזיכרון (לא חוסם את ה-API).
 */
export async function applyRateLimit(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);
  const kind = pickLimiterKind(pathname);
  const key = rateLimitKey(pathname, ip, kind);
  const { limit, windowMs } = LIMITER_WINDOWS[kind];

  const pair = getLimiters();
  if (!pair) {
    const { success, remaining, reset } = applyMemoryRateLimit(key, limit, windowMs);
    if (success) {
      return rateLimitHeaders(NextResponse.next(), limit, remaining, reset);
    }
    return NextResponse.json(
      { error: "יותר מדי בקשות. נסה שוב בעוד רגע." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  const limiter = pair[kind];
  const { success, limit: upLimit, remaining, reset } = await limiter.limit(key);

  if (success) {
    return rateLimitHeaders(NextResponse.next(), upLimit, remaining, reset);
  }

  return NextResponse.json(
    { error: "יותר מדי בקשות. נסה שוב בעוד רגע." },
    {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": String(upLimit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(reset),
      },
    }
  );
}

/** אזהרה בהפעלת שרת Node — לוג ב-Vercel אם חסר Upstash בפרוד */
export function warnIfProductionMissingUpstash(): void {
  if (!isProductionRuntime()) return;
  if (getUpstashRedisConfig()) return;
  console.error(
    "[security] UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN חסרים בפרוד — הגבלת קצב בזיכרון בלבד (לא משותפת בין אינסטנסים). מומלץ מאוד להגדיר Upstash."
  );
}

/** דגל פיתוח מסוכן בפרוד — החלפת משתמש ללא סיסמה. לוג בולט אם הופעל בטעות. */
export function warnIfProductionDevUserSwitch(): void {
  if (!isProductionRuntime()) return;
  if (process.env.ALLOW_DEV_USER_SWITCH !== "true") return;
  console.error(
    "[security] ALLOW_DEV_USER_SWITCH=true בפרודקשן — מאפשר החלפת משתמש ללא אימות. בטל אלא אם זה מכוון לחלוטין."
  );
}

export function warnIfProductionMissingCronSecret(): void {
  if (!isProductionRuntime()) return;
  if (process.env.CRON_SECRET?.trim()) return;
  console.error(
    "[security] Production requires CRON_SECRET — email queue and background jobs will not run until configured."
  );
}
