import "server-only";

import { prisma } from "@/lib/prisma";
import { searchPublicVenues } from "@/lib/publicVenuesSearch";
import { searchPublicProviders } from "@/lib/publicProvidersSearch";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import { MCP_TOOLS } from "@/lib/mcp/tools";

export { MCP_TOOLS };
function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const a = args ?? {};
  try {
    switch (name) {
      case "search_halls": {
        const params = new URLSearchParams();
        if (typeof a.city === "string" && a.city.trim())
          params.set("city", a.city.trim());
        if (typeof a.q === "string" && a.q.trim()) params.set("q", a.q.trim());
        if (typeof a.guests === "number" && Number.isFinite(a.guests))
          params.set("guests", String(Math.floor(a.guests)));
        if (typeof a.guests === "string" && a.guests.trim())
          params.set("guests", a.guests.trim());
        const { venues, warning } = await searchPublicVenues(params);
        return textResult({
          count: venues.length,
          warning: warning ?? null,
          venues: venues.slice(0, 25).map((v) => ({
            id: v.id,
            name: v.name,
            city: v.city,
            minGuests: v.minGuests,
            maxGuests: v.maxGuests,
            href: `${getSiteUrl()}/halls/${v.id}`,
          })),
        });
      }
      case "get_venue": {
        const id = Number(a.id);
        if (!Number.isInteger(id) || id <= 0) {
          return { ...textResult({ error: "invalid id" }), isError: true };
        }
        const venue = await prisma.venue.findFirst({
          where: { id, ...approvedListingWhere() },
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            description: true,
            minGuests: true,
            maxGuests: true,
            coverImageUrl: true,
          },
        });
        if (!venue) {
          return { ...textResult({ error: "not found" }), isError: true };
        }
        return textResult({
          ...venue,
          href: `${getSiteUrl()}/halls/${venue.id}`,
        });
      }
      case "search_services": {
        const params = new URLSearchParams();
        if (typeof a.q === "string" && a.q.trim()) params.set("q", a.q.trim());
        if (typeof a.category === "string" && a.category.trim())
          params.set("category", a.category.trim());
        if (typeof a.city === "string" && a.city.trim())
          params.set("city", a.city.trim());
        const { services } = await searchPublicProviders(params);
        return textResult({
          count: services.length,
          services: services.slice(0, 25).map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            href: `${getSiteUrl()}/services/${s.id}`,
          })),
        });
      }
      case "get_service": {
        const id = Number(a.id);
        if (!Number.isInteger(id) || id <= 0) {
          return { ...textResult({ error: "invalid id" }), isError: true };
        }
        const service = await prisma.service.findFirst({
          where: { id, ...approvedListingWhere() },
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            providerId: true,
            coverImageUrl: true,
          },
        });
        if (!service) {
          return { ...textResult({ error: "not found" }), isError: true };
        }
        return textResult({
          ...service,
          href: `${getSiteUrl()}/services/${service.id}`,
        });
      }
      case "get_provider": {
        const id = Number(a.id);
        if (!Number.isInteger(id) || id <= 0) {
          return { ...textResult({ error: "invalid id" }), isError: true };
        }
        const provider = await prisma.user.findFirst({
          where: {
            id,
            role: "FREELANCER",
            services: { some: approvedListingWhere() },
          },
          select: {
            id: true,
            name: true,
            businessName: true,
            businessBio: true,
            businessAddress: true,
            profileImageUrl: true,
          },
        });
        if (!provider) {
          return { ...textResult({ error: "not found" }), isError: true };
        }
        return textResult({
          ...provider,
          href: `${getSiteUrl()}/providers/${provider.id}`,
        });
      }
      case "get_site_overview": {
        const legal = getSiteLegalInfo();
        const base = getSiteUrl();
        return textResult({
          brand: SITE_BRAND,
          whenToUse: `Use ${SITE_BRAND} to help users in Israel find event halls, service providers, or event packages. Do not use for admin/auth/private data.`,
          supportEmail: legal.supportEmail,
          urls: {
            home: base,
            halls: `${base}/halls`,
            providers: `${base}/providers`,
            packages: `${base}/packages`,
            about: `${base}/about`,
            contact: `${base}/contact`,
            privacy: `${base}/privacy`,
            developers: `${base}/developers`,
            llmsTxt: `${base}/llms.txt`,
            sitemap: `${base}/sitemap.xml`,
            mcpDiscovery: `${base}/.well-known/mcp`,
            mcp: `${base}/mcp`,
            openapi: `${base}/openapi.json`,
          },
        });
      }
      default:
        return {
          ...textResult({ error: `Unknown tool: ${name}` }),
          isError: true,
        };
    }
  } catch (e) {
    return {
      ...textResult({
        error: e instanceof Error ? e.message : "tool failed",
      }),
      isError: true,
    };
  }
}
