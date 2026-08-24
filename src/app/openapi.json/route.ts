import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const problemSchema = {
  type: "object",
  required: ["type", "title", "status", "detail", "code"],
  properties: {
    type: { type: "string", format: "uri" },
    title: { type: "string" },
    status: { type: "integer" },
    detail: { type: "string" },
    code: { type: "string" },
    hint: { type: "string" },
    instance: { type: "string" },
  },
} as const;

const venueSchema = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    city: { type: "string" },
    address: { type: "string" },
    minGuests: { type: ["integer", "null"] },
    maxGuests: { type: ["integer", "null"] },
    coverImageUrl: { type: ["string", "null"] },
  },
} as const;

const serviceSchema = {
  type: "object",
  required: ["id", "name", "providerId"],
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    category: { type: ["string", "null"] },
    providerId: { type: "integer" },
    coverImageUrl: { type: ["string", "null"] },
  },
} as const;

export function GET() {
  const base = getSiteUrl();
  const spec = {
    openapi: "3.1.0",
    info: {
      title: `${SITE_BRAND} Public API`,
      version: "1.0.0",
      summary: `${SITE_BRAND} versioned public HTTP API for venues and services`,
      description: `Read-only public API for ${SITE_BRAND} (EventForYou). Versioning uses URL paths (/api/v1). Breaking changes require /api/v2. Active responses send Deprecation: false, API-Version: 1, and Link rel=deprecation to ${base}/developers/versioning. When a version is scheduled for removal, Deprecation: true and a Sunset HTTP-date are sent at least 90 days in advance. Errors use application/problem+json (RFC 9457 style) with a stable machine-readable code and optional hint. Docs: ${base}/docs`,
      contact: {
        name: `${SITE_BRAND} Support`,
        url: `${base}/contact`,
        email: "eventforyou077@gmail.com",
      },
      license: { name: "Proprietary" },
    },
    servers: [{ url: base, description: `${SITE_BRAND} production` }],
    tags: [
      { name: "Venues", description: "Public event hall search" },
      { name: "Services", description: "Public freelancer service search" },
      { name: "Meta", description: "API index and health" },
    ],
    paths: {
      "/api/v1": {
        get: {
          operationId: "getApiIndexV1",
          tags: ["Meta"],
          summary: "Public API index",
          description:
            "Returns versioning policy, endpoint list, and error model for agents.",
          responses: {
            "200": {
              description: "API index",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: [
                      "name",
                      "apiVersion",
                      "versioning",
                      "endpoints",
                      "errors",
                    ],
                    properties: {
                      name: { type: "string" },
                      apiVersion: { type: "string" },
                      versioning: {
                        type: "object",
                        required: ["strategy", "current", "deprecation"],
                        properties: {
                          strategy: { type: "string" },
                          current: { type: "string" },
                          deprecation: { type: "string" },
                        },
                      },
                      documentation: { type: "string", format: "uri" },
                      openapi: { type: "string", format: "uri" },
                      endpoints: {
                        type: "array",
                        items: {
                          type: "object",
                          required: ["method", "path", "operationId", "description"],
                          properties: {
                            method: { type: "string" },
                            path: { type: "string" },
                            operationId: { type: "string" },
                            description: { type: "string" },
                          },
                        },
                      },
                      errors: {
                        type: "object",
                        required: ["contentType", "schema"],
                        properties: {
                          contentType: { type: "string" },
                          schema: { type: "object" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "405": {
              description: "Method not allowed",
              content: {
                "application/problem+json": { schema: problemSchema },
              },
            },
          },
        },
      },
      "/api/v1/health": {
        get: {
          operationId: "healthV1",
          tags: ["Meta"],
          summary: "Health check",
          description: "Liveness probe for the public API surface.",
          responses: {
            "200": {
              description: "Service is up",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data"],
                    properties: {
                      data: {
                        type: "object",
                        required: ["ok", "service", "apiVersion"],
                        properties: {
                          ok: { type: "boolean" },
                          service: { type: "string" },
                          apiVersion: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "429": {
              description: "Rate limited",
              content: {
                "application/problem+json": { schema: problemSchema },
              },
            },
          },
        },
      },
      "/api/v1/venues": {
        get: {
          operationId: "searchVenuesV1",
          tags: ["Venues"],
          summary: "Search public venues",
          description:
            "Search EventForYou public halls/venues by city, free text, and guest count.",
          parameters: [
            {
              name: "q",
              in: "query",
              description: "Free-text query",
              schema: { type: "string" },
            },
            {
              name: "city",
              in: "query",
              description: "City filter",
              schema: { type: "string" },
            },
            {
              name: "guests",
              in: "query",
              description: "Guest count",
              schema: { type: "integer", minimum: 1 },
            },
          ],
          responses: {
            "200": {
              description: "Venue list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: venueSchema },
                      meta: {
                        type: "object",
                        properties: {
                          count: { type: "integer" },
                          warning: { type: ["string", "null"] },
                          apiVersion: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "429": {
              description: "Rate limited",
              content: {
                "application/problem+json": { schema: problemSchema },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/problem+json": { schema: problemSchema },
              },
            },
          },
        },
      },
      "/api/v1/services": {
        get: {
          operationId: "searchServicesV1",
          tags: ["Services"],
          summary: "Search public services",
          description:
            "Search EventForYou public freelancer services by query, category, or city.",
          parameters: [
            {
              name: "q",
              in: "query",
              description: "Free-text query",
              schema: { type: "string" },
            },
            {
              name: "category",
              in: "query",
              description: "Service category",
              schema: { type: "string" },
            },
            {
              name: "city",
              in: "query",
              description: "Service area / city",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Service list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: serviceSchema },
                      meta: {
                        type: "object",
                        properties: {
                          count: { type: "integer" },
                          apiVersion: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "429": {
              description: "Rate limited",
              content: {
                "application/problem+json": { schema: problemSchema },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/problem+json": { schema: problemSchema },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Problem: problemSchema,
        Venue: venueSchema,
        Service: serviceSchema,
      },
    },
  };

  return Response.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
