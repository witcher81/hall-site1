import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Cached = { api: Ratelimit; auth: Ratelimit } | null;

let limiters: Cached | undefined;

function getLimiters(): Cached {
  if (limiters !== undefined) return limiters;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiters = null;
    return null;
  }
  const redis = new Redis({ url, token });
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
  };
  return limiters;
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
 * Rate limit לפי IP (Edge). דורש Upstash Redis — בלי משתני סביבה, עובר הלאה בלי הגבלה.
 * עוזר נגד עומס ו־DoS ברמת האפליקציה; שכבת Vercel/Cloudflare מטפלת ברוב ה־DDoS ברשת.
 */
export async function applyRateLimit(request: NextRequest): Promise<NextResponse> {
  const pair = getLimiters();
  if (!pair) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);
  const isAuth =
    pathname === "/api/auth/login" || pathname === "/api/auth/register";

  const limiter = isAuth ? pair.auth : pair.api;
  const key = isAuth ? `auth:${ip}` : `api:${ip}`;
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
