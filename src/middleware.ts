import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";

/** Webhooks ו־SSE — לא לחסום בגלל חיבורים חוזרים */
const SKIP_PREFIXES = ["/api/webhooks/", "/api/realtime/stream"] as const;

function shouldSkip(pathname: string): boolean {
  return SKIP_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  if (shouldSkip(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return applyRateLimit(request);
}

export const config = {
  matcher: ["/api/:path*"],
};
