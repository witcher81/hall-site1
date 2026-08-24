import { getSiteUrl } from "@/lib/siteUrl";

/**
 * Headers agents use for version + deprecation (RFC 9745 Deprecation, RFC 8594 Sunset).
 * Sunset is omitted while the version is not deprecated; Link always points at the policy.
 */
export function v1ResponseHeaders(extra?: Record<string, string>): Record<string, string> {
  const base = getSiteUrl();
  return {
    "Content-Type": "application/json; charset=utf-8",
    "API-Version": "1",
    Deprecation: "false",
    Link: [
      `<${base}/deprecation>; rel="deprecation"; type="text/html"`,
      `<${base}/api/v1/deprecation>; rel="status"; type="application/json"`,
      `<${base}/developers/versioning>; rel="describedby"; type="text/html"`,
    ].join(", "),
    ...extra,
  };
}

/** When a version is scheduled for removal, callers pass an HTTP-date Sunset value. */
export function v1DeprecatedHeaders(sunsetHttpDate: string): Record<string, string> {
  return v1ResponseHeaders({
    Deprecation: "true",
    Sunset: sunsetHttpDate,
  });
}
