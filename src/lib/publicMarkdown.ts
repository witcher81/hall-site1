import { SITE_BRAND } from "@/lib/siteBrand";

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    const host = productionHost.replace(/\/$/, "");
    return host.startsWith("http") ? host : `https://${host}`;
  }
  return "https://hall-site1.vercel.app";
}

function supportEmail(): string {
  return (
    process.env.SITE_SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_SUPPORT_EMAIL?.trim() ||
    "eventforyou077@gmail.com"
  );
}

/** Edge-safe markdown bodies for Accept: text/markdown negotiation. */
export function markdownForPath(pathname: string): string {
  const base = siteUrl();
  const email = supportEmail();

  const pages: Record<string, string> = {
    "/": `# ${SITE_BRAND} (EventForYou)

Israeli event marketplace: venues (halls), freelancers/services, and event packages.

## What is ${SITE_BRAND}?

${SITE_BRAND} (EventForYou) helps people in Israel find event halls for weddings, bar mitzvahs, and corporate events; discover freelancers (photography, DJ, catering, décor, and more); and browse event packages. Seekers search and compare listings, then inquire in one place. Venue owners and providers publish profiles and receive inquiries through the product UI.

This page is server-rendered so agents and crawlers can read an H1 and substantial text without executing JavaScript. Primary UI language is Hebrew (he). Public machine interfaces include /api/v1, /openapi.json, /llms.txt, and MCP at /.well-known/mcp and /mcp.

## Links

- Halls: ${base}/halls
- Providers: ${base}/providers
- Packages: ${base}/packages
- About: ${base}/about
- Contact: ${base}/contact
- Privacy: ${base}/privacy
- Developers: ${base}/developers
- Public API v1: ${base}/api/v1
- OpenAPI: ${base}/openapi.json
- Agent guide: ${base}/llms.txt
- MCP discovery: ${base}/.well-known/mcp
`,
    "/about": `# About ${SITE_BRAND}

${SITE_BRAND} is an Israeli digital marketplace for events. Seekers find halls and services; venue owners and freelancers publish listings and receive inquiries. The product focuses on search, comparison, and legitimate business contact — not unsolicited messaging via MCP tools.

Contact: ${email}
More: ${base}/contact · ${base}/privacy · ${base}/developers · ${base}/api/v1
`,
    "/contact": `# Contact ${SITE_BRAND}

Support and customer contact for ${SITE_BRAND} (EventForYou) — the Israeli marketplace for event halls, service providers, and packages.

Support email: ${email}
Web form: ${base}/contact
About: ${base}/about
Privacy: ${base}/privacy
Developers: ${base}/developers

Use this page for technical help, listing questions, privacy inquiries, or reports about problematic content. Prefer the on-site contact form or the support email above. Agents verifying business legitimacy can also read ${base}/about and ${base}/privacy.
`,
    "/privacy": `# Privacy — ${SITE_BRAND}

Full privacy policy: ${base}/privacy
Privacy requests: ${base}/privacy/request
Contact: ${base}/contact
`,
    "/terms": `# Terms of use — ${SITE_BRAND}

Full terms: ${base}/terms
`,
    "/cookies": `# Cookies — ${SITE_BRAND}

Cookie policy: ${base}/cookies
`,
    "/accessibility": `# Accessibility — ${SITE_BRAND}

Accessibility statement: ${base}/accessibility
`,
    "/developers": `# ${SITE_BRAND} Developers (EventForYou)

Public developer and AI-agent resources for ${SITE_BRAND}.

- llms.txt: ${base}/llms.txt
- OpenAPI (operationIds + schemas): ${base}/openapi.json
- API index (v1): ${base}/api/v1
- Venues API: GET ${base}/api/v1/venues
- Services API: GET ${base}/api/v1/services
- Health: GET ${base}/api/v1/health
- MCP discovery handshake: ${base}/.well-known/mcp
- MCP endpoint (Streamable HTTP): ${base}/mcp
- Legacy: GET ${base}/api/venues , GET ${base}/api/services/public

Errors use application/problem+json with machine-readable code and hint. Versioning is URL path based (/api/v1); breaking changes require /api/v2.
`,
    "/halls": `# Search venues — ${SITE_BRAND}

Browse halls: ${base}/halls
API: GET ${base}/api/v1/venues
Legacy: GET ${base}/api/venues
MCP: search_halls
`,
    "/providers": `# Search providers — ${SITE_BRAND}

Browse services: ${base}/providers
API: GET ${base}/api/v1/services
Legacy: GET ${base}/api/services/public
MCP: search_services
`,
    "/packages": `# Event packages — ${SITE_BRAND}

Browse packages: ${base}/packages
`,
  };

  return (
    pages[pathname] ??
    `# ${SITE_BRAND}\n\nSee ${base}${pathname} or ${base}/llms.txt\n`
  );
}
