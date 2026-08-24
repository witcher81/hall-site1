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

Israeli event marketplace hosted at hall-site1.vercel.app: venues (halls), freelancers/services, and event packages.

## What is ${SITE_BRAND}?

${SITE_BRAND} (EventForYou) helps people in Israel find event halls for weddings, bar mitzvahs, and corporate events; discover freelancers (photography, DJ, catering, décor, and more); and browse event packages. Seekers search and compare listings, then inquire in one place. Venue owners and providers publish profiles and receive inquiries through the product UI.

This page is server-rendered so agents and crawlers can read an H1 plus nested H2/H3 headings and substantial text without executing JavaScript. Primary UI language is Hebrew (he).

### Who it is for

Seekers comparing halls and services; venue owners publishing listings; freelancers managing service profiles. Trust pages cover about, contact, and privacy.

## Browse the product

### Search and discovery

- Halls: ${base}/halls
- Providers: ${base}/providers
- Packages: ${base}/packages

### Trust and contact

- About: ${base}/about
- Contact: ${base}/contact
- Privacy: ${base}/privacy
- Brand landing: ${base}/eventforyou

## Developers and AI agents

### REST API and OpenAPI

- Developers: ${base}/developers
- Docs: ${base}/docs
- Vercel hosting notes: ${base}/developers/vercel
- Public API v1: ${base}/api/v1
- OpenAPI: ${base}/openapi.json
- Deprecation: ${base}/deprecation

### MCP and agent files

- Agent guide: ${base}/llms.txt
- MCP server card: ${base}/.well-known/mcp
- MCP Registry: ${base}/server.json
- MCP endpoint: ${base}/mcp
- AI catalog: ${base}/.well-known/ai-catalog.json
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

${SITE_BRAND} (EventForYou) respects your privacy. This policy explains what data we collect when you use the Israeli event marketplace (venues, services, packages), how it is used, and how to request access, correction, or deletion.

We collect account details (name, email, role), listing content you publish, inquiries and messages you send, and technical usage data such as login cookies and page metrics. We use this information to operate accounts, show search results, send notifications, prevent abuse (including rate limits), and improve the service.

Inquiry details are shared only with the relevant venue owner or provider. Infrastructure vendors (hosting, database, email, error reporting) receive only what they need. We do not sell personal information. Account data is kept while the account is active or as required for security, disputes, and law.

Privacy requests: ${base}/privacy/request
Contact: ${base}/contact
Full HTML policy: ${base}/privacy
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

Public developer and AI-agent resources for ${SITE_BRAND} at hall-site1.vercel.app (Vercel).

- Docs: ${base}/docs
- Developers: ${base}/developers
- EventForYou on Vercel: ${base}/developers/vercel
- Versioning / deprecation: ${base}/deprecation · ${base}/developers/versioning
- llms.txt: ${base}/llms.txt
- OpenAPI (operationIds + typed schemas): ${base}/openapi.json
- API catalog: ${base}/api
- API index (v1): ${base}/api/v1
- Venues API: GET ${base}/api/v1/venues
- Services API: GET ${base}/api/v1/services
- Health: GET ${base}/api/v1/health
- MCP server card: ${base}/.well-known/mcp
- MCP Registry: ${base}/server.json
- MCP endpoint (Streamable HTTP): ${base}/mcp
- AI catalog: ${base}/.well-known/ai-catalog.json

Public GET endpoints require no API key. Errors use application/problem+json. Versioning is URL path based (/api/v1); breaking changes require /api/v2. Deprecated versions send Deprecation and Sunset headers.
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

  const key =
    pathname === "/docs" || pathname === "/developers/vercel"
      ? "/developers"
      : pathname;
  return (
    pages[key] ??
    `# ${SITE_BRAND}\n\nSee ${base}${pathname} or ${base}/llms.txt\n`
  );
}
