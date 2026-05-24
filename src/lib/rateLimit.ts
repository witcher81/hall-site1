import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isProductionRuntime } from "@/lib/isProduction";
import { getUpstashRedisConfig } from "@/lib/upstashEnv";

type LimiterSet = {
  api: Ratelimit;
  auth: Ratelimit;
  heavy: Ratelimit;
  sensitive: Ratelimit;
};

type Cached = LimiterSet | null;

let limiters: Cached | undefined;

const AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

const HEAVY_PREFIXES = [
  "/api/inquiry/deal-insights",
  "/api/inquiry/freelancer-alternatives",
  "/api/geocode/",
] as const;

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
  };
  return limiters;
}

function pickLimiter(pathname: string, pair: LimiterSet): Ratelimit {
  if (AUTH_PATHS.has(pathname)) return pair.auth;
  if (pathname === "/api/venue-owner/venues/boost") return pair.sensitive;
  if (HEAVY_PREFIXES.some((p) => pathname.startsWith(p))) return pair.heavy;
  return pair.api;
}

function rateLimitKey(pathname: string, ip: string, limiter: Ratelimit, pair: LimiterSet): string {
  if (limiter === pair.auth) return `auth:${ip}`;
  if (limiter === pair.heavy) return `heavy:${ip}`;
  if (limiter === pair.sensitive) return `sensitive:${ip}:${pathname}`;
  return `api:${ip}`;
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

const RATE_LIMIT_UNAVAILABLE_HE =
  "הגבלת קצב API לא מוגדרת בשרת. נסו שוב מאוחר יותר.";

/**
 * Rate limit לפי IP (Edge). בפרוד — דורש Upstash; בלי משתני סביבה מחזיר 503.
 * בפיתוח מקומי — עובר הלאה בלי הגבלה אם Upstash לא מוגדר.
 */
export async function applyRateLimit(request: NextRequest): Promise<NextResponse> {
  const pair = getLimiters();
  if (!pair) {
    if (isProductionRuntime()) {
      return NextResponse.json({ error: RATE_LIMIT_UNAVAILABLE_HE }, { status: 503 });
    }
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);
  const limiter = pickLimiter(pathname, pair);
  const key = rateLimitKey(pathname, ip, limiter, pair);
  const { success, limit, remaining, reset } = await limiter.limit(key);

  if (success) {
    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", String(limit));
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    res.headers.set("X-RateLimit-Reset", String(reset));
    return res;
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

/** אזהרה בהפעלת שרת Node — לוג ב-Vercel אם חסר Upstash בפרוד */
export function warnIfProductionMissingUpstash(): void {
  if (!isProductionRuntime()) return;
  if (getUpstashRedisConfig()) return;
  console.error(
    "[security] Production requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN — API requests return 503 until configured."
  );
}
