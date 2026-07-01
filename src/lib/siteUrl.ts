/**
 * כתובת בסיס לאתר (OG, canonical). הגדר NEXT_PUBLIC_SITE_URL בפרודקשן.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

type RequestLike = {
  headers: { get(name: string): string | null };
  nextUrl: { host: string; protocol: string };
};

/**
 * כתובת לקישורים במייל — מעדיף NEXT_PUBLIC_SITE_URL; אחרת את הדומיין של הבקשה הנוכחית.
 */
export function getSiteUrlFromRequest(req: RequestLike): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host =
    forwardedHost?.split(",")[0]?.trim() ||
    req.headers.get("host")?.trim() ||
    req.nextUrl.host;
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0]?.trim() ||
    req.nextUrl.protocol.replace(":", "") ||
    "https";
  return `${proto}://${host}`;
}
