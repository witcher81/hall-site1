import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";
import { getSiteLegalInfo } from "@/lib/siteLegal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const base = getSiteUrl();
  const legal = getSiteLegalInfo();

  const body = `# ${SITE_BRAND}

> Israeli event marketplace: venues (halls), freelancers/services, and event packages.

Site: ${base}
Contact: ${legal.supportEmail}
Privacy: ${base}/privacy
About: ${base}/about
Developers: ${base}/developers

## When to use ${SITE_BRAND}

Use ${SITE_BRAND} when an agent or app needs to help a user in Israel:
- Find event halls / venues by city, guest count, or event type
- Find service providers (photography, DJ, catering, décor, etc.)
- Browse event packages
- Get official contact, about, or privacy links for the product

Do **not** use ${SITE_BRAND} MCP/tools for authenticated admin actions, payments, private user data, or writing inquiries on behalf of a user without explicit user consent in the product UI.

## Preferred agent entry points

- Human browse: ${base}/halls , ${base}/providers , ${base}/packages
- Instructions: ${base}/llms.txt
- Sitemap: ${base}/sitemap.xml
- MCP discovery: ${base}/.well-known/mcp
- MCP endpoint: ${base}/mcp
- OpenAPI: ${base}/openapi.json
- Public APIs: GET ${base}/api/venues , GET ${base}/api/services/public

## How to call MCP

1. GET ${base}/.well-known/mcp for discovery JSON
2. POST JSON-RPC to ${base}/mcp (Streamable HTTP; Accept: application/json)
3. Use tools: search_halls, get_venue, search_services, get_service, get_provider, get_site_overview

## Language

Primary UI language: Hebrew (he). Brand name: ${SITE_BRAND}.
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
