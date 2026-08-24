import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";
import {
  isMarkdownNegotiablePath,
  negotiateHtmlOrMarkdown,
} from "@/lib/acceptMarkdown";
import { markdownForPath } from "@/lib/publicMarkdown";

/** Webhooks ו־SSE — לא לחסום בגלל חיבורים חוזרים */
const SKIP_PREFIXES = [
  "/api/webhooks/",
  "/api/realtime/stream",
] as const;
const CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_ALLOWED_HEADERS =
  "Content-Type, Authorization, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name";

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

function mergeVary(res: NextResponse, value: string): void {
  const existing = res.headers.get("Vary");
  if (!existing) {
    res.headers.set("Vary", value);
    return;
  }
  const parts = new Set(
    existing.split(",").map((s) => s.trim()).filter(Boolean)
  );
  for (const v of value.split(",")) {
    const t = v.trim();
    if (t) parts.add(t);
  }
  res.headers.set("Vary", Array.from(parts).join(", "));
}

function applyCorsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const origin = readOrigin(req);
  if (!origin) return res;
  if (!isAllowedCorsOrigin(req)) return res;
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", CORS_METHODS);
  res.headers.set("Access-Control-Allow-Headers", CORS_ALLOWED_HEADERS);
  mergeVary(res, "Origin");
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
  mergeVary(res, "Accept, Accept-Encoding");
  return res;
}

function isPassthroughAppPath(pathname: string): boolean {
  if (isMarkdownNegotiablePath(pathname)) return true;
  if (
    pathname === "/llms.txt" ||
    pathname === "/openapi.json" ||
    pathname === "/mcp" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return true;
  }
  return /^(?:\/(?:api|halls|providers|services|packages|auth|dashboard|admin|settings|privacy|event-tools|event-planner|event-builder|favorites|messages|notifications|my-inquiries|my-plans|my-service-requests|trending|uploads|\.well-known)(?:\/|$))/.test(
    pathname
  );
}

function markdown404Body(pathname: string): string {
  return `# 404 — EventForYou

Path \`${pathname}\` does not exist.

## Where to look next
- / (home)
- /halls (search venues)
- /providers (search services)
- /packages (event packages)
- /about · /contact · /privacy
- /developers · /api/v1 · /openapi.json
- /llms.txt · /sitemap.xml
- /.well-known/mcp · /mcp
`;
}

function handleMarkdownNegotiation(request: NextRequest): NextResponse | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const pathname = request.nextUrl.pathname;
  const decision = negotiateHtmlOrMarkdown(request.headers.get("accept"));

  if (decision.kind === "markdown") {
    if (isMarkdownNegotiablePath(pathname)) {
      const body = markdownForPath(pathname);
      const res = new NextResponse(request.method === "HEAD" ? null : body, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=120",
        },
      });
      mergeVary(res, "Accept, Accept-Encoding");
      return res;
    }
    if (!isPassthroughAppPath(pathname)) {
      const body = markdown404Body(pathname);
      const res = new NextResponse(request.method === "HEAD" ? null : body, {
        status: 404,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
      mergeVary(res, "Accept, Accept-Encoding");
      return res;
    }
  }

  if (decision.kind === "not_acceptable" && isMarkdownNegotiablePath(pathname)) {
    const res = new NextResponse("Not Acceptable", { status: 406 });
    res.headers.set("Content-Type", "text/plain; charset=utf-8");
    mergeVary(res, "Accept, Accept-Encoding");
    return res;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const applyCsp = IS_PRODUCTION && !isApiPath(pathname);

  // נתיבי דפים (לא API): markdown negotiation + CSP
  if (!isApiPath(pathname)) {
    const md = handleMarkdownNegotiation(request);
    if (md) return md;
    if (!applyCsp) {
      const res = NextResponse.next();
      mergeVary(res, "Accept, Accept-Encoding");
      return res;
    }
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
