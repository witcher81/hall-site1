import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";

/** Webhooks ו־SSE — לא לחסום בגלל חיבורים חוזרים */
const SKIP_PREFIXES = [
  "/api/webhooks/",
  "/api/realtime/stream",
  "/api/health",
] as const;
const CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_ALLOWED_HEADERS = "Content-Type, Authorization";

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

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    if (!isAllowedCorsOrigin(request)) {
      return NextResponse.json({ error: "CORS origin not allowed" }, { status: 403 });
    }
    return applyCorsHeaders(request, new NextResponse(null, { status: 204 }));
  }

  if (shouldSkip(request.nextUrl.pathname)) {
    return applyCorsHeaders(request, NextResponse.next());
  }
  const rateLimitResponse = await applyRateLimit(request);
  return applyCorsHeaders(request, rateLimitResponse);
}

export const config = {
  matcher: ["/api/:path*"],
};
