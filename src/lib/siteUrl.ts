/**
 * כתובת בסיס ציבורית לאתר (OG, canonical, MCP, OpenAPI).
 * חשוב: אל תשתמשו ב-VERCEL_URL של deployment בודד — זה preview עם SSO שמפנה ל-vercel.com.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    const host = productionHost.replace(/\/$/, "");
    return host.startsWith("http") ? host : `https://${host}`;
  }

  // Fallback יציב לפרויקט הזה כשאין env (מונע קישורי preview ב-MCP/OpenAPI)
  if (process.env.VERCEL) {
    return "https://hall-site1.vercel.app";
  }

  return "http://localhost:3000";
}

type RequestLike = {
  headers: { get(name: string): string | null };
  nextUrl: { host: string; protocol: string };
};

/**
 * כתובת לקישורים במייל — מעדיף NEXT_PUBLIC_SITE_URL / production; אחרת את דומיין הבקשה.
 */
export function getSiteUrlFromRequest(req: RequestLike): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    const host = productionHost.replace(/\/$/, "");
    return host.startsWith("http") ? host : `https://${host}`;
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host =
    forwardedHost?.split(",")[0]?.trim() ||
    req.headers.get("host")?.trim() ||
    req.nextUrl.host;
  // אל תבנו קישורי מייל על *.vercel.app של deployment preview
  if (host && !host.includes(".vercel.app")) {
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const proto =
      forwardedProto?.split(",")[0]?.trim() ||
      req.nextUrl.protocol.replace(":", "") ||
      "https";
    return `${proto}://${host}`;
  }

  return getSiteUrl();
}
