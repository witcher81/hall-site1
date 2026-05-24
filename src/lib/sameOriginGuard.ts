import type { NextRequest } from "next/server";

function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * בקשות מהדפדפן של האתר (Origin / Referer) — מפחית שימוש ישיר ב-API מבחוץ.
 * בפיתוח מקומי מאפשר גם localhost ללא כותרות (Postman).
 */
export function isSameOriginApiRequest(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    const host = req.headers.get("host")?.split(":")[0]?.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }
  }

  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!host) return false;

  const origin = req.headers.get("origin");
  if (origin) {
    const oh = hostnameFromUrl(origin);
    return oh === host;
  }

  const referer = req.headers.get("referer");
  if (referer) {
    const rh = hostnameFromUrl(referer);
    return rh === host;
  }

  return false;
}
