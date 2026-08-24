import { SITE_BRAND } from "@/lib/siteBrand";

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
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
    "/": `# ${SITE_BRAND}

Israeli event marketplace: venues, service providers, and event packages.

## What is ${SITE_BRAND}?

${SITE_BRAND} helps people in Israel find event halls, freelancers (photography, DJ, catering, décor, and more), and event packages — search, compare, and inquire in one place.

## Links

- Halls: ${base}/halls
- Providers: ${base}/providers
- Packages: ${base}/packages
- About: ${base}/about
- Contact: ${base}/contact
- Privacy: ${base}/privacy
- Developers: ${base}/developers
- Agent guide: ${base}/llms.txt
- MCP: ${base}/.well-known/mcp
`,
    "/about": `# About ${SITE_BRAND}

${SITE_BRAND} is an Israeli digital marketplace for events. Seekers find halls and services; venue owners and freelancers publish listings and receive inquiries.

Contact: ${email}
More: ${base}/contact · ${base}/privacy · ${base}/developers
`,
    "/contact": `# Contact ${SITE_BRAND}

Support email: ${email}
Web form: ${base}/contact
`,
    "/privacy": `# Privacy — ${SITE_BRAND}

Full privacy policy: ${base}/privacy
Privacy requests: ${base}/privacy/request
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
    "/developers": `# ${SITE_BRAND} Developers

- llms.txt: ${base}/llms.txt
- OpenAPI: ${base}/openapi.json
- MCP discovery: ${base}/.well-known/mcp
- MCP endpoint: ${base}/mcp
- GET /api/venues
- GET /api/services/public
`,
    "/halls": `# Search venues — ${SITE_BRAND}

Browse halls: ${base}/halls
API: GET ${base}/api/venues
MCP: search_halls
`,
    "/providers": `# Search providers — ${SITE_BRAND}

Browse services: ${base}/providers
API: GET ${base}/api/services/public
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
