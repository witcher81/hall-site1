import { getSiteUrl } from "@/lib/siteUrl";

/** Headers agents use to detect version + deprecation policy (RFC 8594 Sunset). */
export function v1ResponseHeaders(): Record<string, string> {
  const base = getSiteUrl();
  return {
    "Content-Type": "application/json; charset=utf-8",
    "API-Version": "1",
    Deprecation: "false",
    Link: `<${base}/developers/versioning>; rel="deprecation"; type="text/html"`,
  };
}
