import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";

/** Webhooks ו־SSE — לא לחסום בגלל חיבורים חוזרים */
const SKIP_PREFIXES = [
  "/api/webhooks/",
  "/api/realtime/stream",
  "/api/health",
  "/api/dev/",
] as const;
const CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_ALLOWED_HEADERS = "Content-Type, Authorization";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function shouldSkip(pathname: string): boolean {
  return SKIP_PREFIXES.some((p) => pathname.startsWith(p));
}

function getAllowedOrigins(): Set<string> {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function readOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin")?.trim();
  return origin || null;
}

function isAllowedCorsOrigin(req: NextRequest): boolean {
  const origin = readOrigin(req);
  if (!origin) return false;
  if (origin === req.nextUrl.origin) return true;
  return getAllowedOrigins().has(origin);
}

function applyCorsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const origin = readOrigin(req);
  if (!origin) return res;
  if (!isAllowedCorsOrigin(req)) return res;
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", CORS_METHODS);
  res.headers.set("Access-Control-Allow-Headers", CORS_ALLOWED_HEADERS);
  res.headers.set("Vary", "Origin");
  return res;
}

/** nonce אקראי לכל בקשה (base64) — מאפשר רק סקריפטים מאושרים, חוסם הזרקת inline */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * CSP מבוסס-nonce בפרודקשן: script-src עם nonce + strict-dynamic (בלי unsafe-inline/unsafe-eval).
 * style-src נשאר עם unsafe-inline (Tailwind/inline styles — סיכון נמוך מהותית מסקריפטים).
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://photon.komoot.io https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org https://server.arcgisonline.com https://cdnjs.cloudflare.com https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.sentry.io",
    "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** מצרף nonce לבקשה (x-nonce — Next מחיל אוטומטית על הסקריפטים שלו) ו-CSP לתגובה */
function withCspNonce(req: NextRequest): NextResponse {
  const nonce = generateNonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", buildCsp(nonce));
  return res;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const applyCsp = IS_PRODUCTION && !isApiPath(pathname);

  // נתיבי דפים (לא API): רק הזרקת CSP מבוסס-nonce
  if (!isApiPath(pathname)) {
    if (!applyCsp) return NextResponse.next();
    return withCspNonce(request);
  }

  // נתיבי API: CORS + הגבלת קצב (CSP לא רלוונטי ל-JSON)
  if (request.method === "OPTIONS") {
    if (!isAllowedCorsOrigin(request)) {
      return NextResponse.json({ error: "CORS origin not allowed" }, { status: 403 });
    }
    return applyCorsHeaders(request, new NextResponse(null, { status: 204 }));
  }

  if (shouldSkip(pathname)) {
    return applyCorsHeaders(request, NextResponse.next());
  }
  const rateLimitResponse = await applyRateLimit(request);
  return applyCorsHeaders(request, rateLimitResponse);
}

export const config = {
  matcher: [
    // כל הנתיבים חוץ מנכסים סטטיים (כדי להחיל CSP על דפים + לשמור CORS/קצב על API)
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
