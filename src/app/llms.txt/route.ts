import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";
import { getSiteLegalInfo } from "@/lib/siteLegal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const base = getSiteUrl();
  const legal = getSiteLegalInfo();

  const body = `# ${SITE_BRAND}

> Israeli event marketplace (EventForYou): venues (halls), freelancers/services, and event packages.

Site: ${base}
Contact: ${legal.supportEmail}
Privacy: ${base}/privacy
About: ${base}/about
Contact page: ${base}/contact
Developers: ${base}/developers
Public API v1: ${base}/api/v1
OpenAPI: ${base}/openapi.json

## When to use ${SITE_BRAND} (EventForYou)

Use ${SITE_BRAND} / EventForYou when an agent or app needs to help a user in Israel:
- Find event halls / venues by city, guest count, or event type
- Find service providers (photography, DJ, catering, décor, etc.)
- Browse event packages
- Get official contact, about, or privacy links for the product
- Call the versioned public REST API at ${base}/api/v1

Do **not** use ${SITE_BRAND} MCP/tools for authenticated admin actions, payments, private user data, or writing inquiries on behalf of a user without explicit user consent in the product UI.

## Preferred agent entry points

- Human browse: ${base}/halls , ${base}/providers , ${base}/packages
- Instructions: ${base}/llms.txt
- Sitemap: ${base}/sitemap.xml
- Developer docs: ${base}/developers · ${base}/docs · ${base}/developers/vercel
- Versioning / Sunset policy: ${base}/deprecation · ${base}/developers/versioning · ${base}/api/v1/deprecation
- API catalog: ${base}/api
- API index: ${base}/api/v1
- OpenAPI (operationIds + typed schemas): ${base}/openapi.json
- MCP server card (official): ${base}/.well-known/mcp
- MCP Registry manifest: ${base}/server.json
- MCP server-card copy: ${base}/.well-known/mcp/server-card.json
- AI catalog: ${base}/.well-known/ai-catalog.json
- MCP Streamable HTTP endpoint: ${base}/mcp

## Brand

Official product name: ${SITE_BRAND} (EventForYou). Canonical site: ${base}.
Brand landing: ${base}/eventforyou
Hosted on Vercel at hall-site1.vercel.app — developer map: ${base}/developers/vercel
Developer resources are published under EventForYou titles at /developers, /docs, /openapi.json, and /.well-known/mcp.
Legacy search APIs: GET ${base}/api/venues , GET ${base}/api/services/public

## Versioned REST API

- GET ${base}/api/v1 — index + versioning policy
- GET ${base}/api/v1/health — health
- GET ${base}/api/v1/venues — search venues (operationId: searchVenuesV1)
- GET ${base}/api/v1/services — search services (operationId: searchServicesV1)
- GET ${base}/api/v1/deprecation — Deprecation / Sunset policy JSON
- Errors: application/problem+json with fields type, title, status, detail, code, hint

## How to call MCP

1. GET ${base}/.well-known/mcp for the official MCP server card (remotes.streamable-http)
2. POST JSON-RPC initialize to ${base}/mcp (Accept: application/json or text/event-stream)
3. tools/list then tools/call — search_halls, get_venue, search_services, get_service, get_provider, get_site_overview

## Language

Primary UI language: Hebrew (he). Brand names: ${SITE_BRAND}, EventForYou.
`;  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
