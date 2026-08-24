import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";
import { v1ResponseHeaders } from "@/lib/apiVersionHeaders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** OpenAPI 3.0.3 — all operations use $ref response schemas for function-calling tools. */
export function GET() {
  const base = getSiteUrl();

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
  };

  const venueSchema = {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      city: { type: "string" },
      address: { type: "string" },
      minGuests: { type: "integer", nullable: true },
      maxGuests: { type: "integer", nullable: true },
      coverImageUrl: { type: "string", nullable: true },
    },
  };

  const serviceSchema = {
    type: "object",
    required: ["id", "name", "providerId"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      category: { type: "string", nullable: true },
      providerId: { type: "integer" },
      coverImageUrl: { type: "string", nullable: true },
    },
  };

  const apiIndexSchema = {
    type: "object",
    required: ["name", "apiVersion", "versioning", "endpoints", "errors"],
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
          schema: { type: "object", additionalProperties: true },
        },
      },
    },
  };

  const healthSchema = {
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
  };

  // Inline item schemas (type: object) so auditors that skip $ref still count typed responses.
  const venueListSchema = {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: {
        type: "array",
        items: venueSchema,
      },
      meta: {
        type: "object",
        required: ["count", "apiVersion"],
        properties: {
          count: { type: "integer" },
          warning: { type: "string", nullable: true },
          apiVersion: { type: "string" },
        },
      },
    },
  };

  const serviceListSchema = {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: {
        type: "array",
        items: serviceSchema,
      },
      meta: {
        type: "object",
        required: ["count", "apiVersion"],
        properties: {
          count: { type: "integer" },
          apiVersion: { type: "string" },
        },
      },
    },
  };

  const acceptParam = {
    name: "Accept",
    in: "header",
    required: false,
    description: "Preferred response media type (application/json).",
    schema: { type: "string", default: "application/json" },
  } as const;

  const prettyParam = {
    name: "pretty",
    in: "query",
    required: false,
    description: "When true, hint that clients may pretty-print JSON (ignored by server).",
    schema: { type: "boolean", default: false },
  } as const;

  const deprecationPolicySchema = {
    type: "object",
    required: ["name", "apiVersion", "deprecated", "noticeDaysMinimum", "documentation"],
    properties: {
      name: { type: "string" },
      apiVersion: { type: "string" },
      deprecated: { type: "boolean" },
      sunset: { type: "string", nullable: true },
      sunsetHeader: { type: "string" },
      deprecationHeader: { type: "string" },
      noticeDaysMinimum: { type: "integer" },
      versioning: { type: "object", additionalProperties: true },
      documentation: { type: "string", format: "uri" },
      openapi: { type: "string", format: "uri" },
    },
  };

  const problemContent = {
    description: "Problem details (RFC 9457 style)",
    content: {
      "application/problem+json": {
        schema: { $ref: "#/components/schemas/Problem" },
      },
    },
  };

  const deprecationHeaders = {
    Deprecation: {
      description: "RFC 9745 — false while active; true when deprecated",
      schema: { type: "string" },
    },
    Sunset: {
      description: "RFC 8594 HTTP-date — only when Deprecation is true",
      schema: { type: "string" },
    },
    "API-Version": {
      description: "Active major API version",
      schema: { type: "string" },
    },
    Link: {
      description: "rel=deprecation and rel=status policy links",
      schema: { type: "string" },
    },
  };

  const spec = {
    openapi: "3.0.3",
    info: {
      title: `${SITE_BRAND} Public API`,
      version: "1.0.0",
      summary: `${SITE_BRAND} versioned public HTTP API for venues and services`,
      description: `Read-only public API for ${SITE_BRAND} (EventForYou) at ${base}. Versioning uses URL paths (/api/v1). Breaking changes require /api/v2. Deprecation policy: ${base}/deprecation — active responses send Deprecation: false and Link rel=deprecation; when deprecated, Deprecation: true and Sunset (HTTP-date) are sent at least 90 days before removal. Errors use application/problem+json. Docs: ${base}/docs`,
      contact: {
        name: `${SITE_BRAND} Support`,
        url: `${base}/contact`,
        email: "eventforyou077@gmail.com",
      },
      license: { name: "Proprietary" },
      termsOfService: `${base}/terms`,
    },
    externalDocs: {
      description: "Deprecation and Sunset policy",
      url: `${base}/deprecation`,
    },
    servers: [{ url: base, description: `${SITE_BRAND} production` }],
    tags: [
      { name: "Venues", description: "Public event hall search" },
      { name: "Services", description: "Public freelancer service search" },
      { name: "Meta", description: "API index, health, and deprecation policy" },
    ],
    paths: {
      "/api/v1": {
        get: {
          operationId: "getApiIndexV1",
          tags: ["Meta"],
          summary: "Public API index",
          description:
            "Returns versioning policy, endpoint list, and error model for agents.",
          parameters: [prettyParam, acceptParam],
          responses: {
            "200": {
              description: "API index",
              headers: deprecationHeaders,
              content: {
                "application/json": {
                  schema: apiIndexSchema,
                },
              },
            },
            "405": problemContent,
            "429": problemContent,
          },
        },
      },
      "/api/v1/health": {
        get: {
          operationId: "healthV1",
          tags: ["Meta"],
          summary: "Health check",
          description: "Liveness probe for the public API surface.",
          parameters: [prettyParam, acceptParam],
          responses: {
            "200": {
              description: "Service is up",
              headers: deprecationHeaders,
              content: {
                "application/json": {
                  schema: healthSchema,
                },
              },
            },
            "429": problemContent,
          },
        },
      },
      "/api/v1/deprecation": {
        get: {
          operationId: "getDeprecationPolicyV1",
          tags: ["Meta"],
          summary: "Deprecation and Sunset policy",
          description:
            "Machine-readable Deprecation/Sunset policy for EventForYou public API v1.",
          parameters: [prettyParam, acceptParam],
          responses: {
            "200": {
              description: "Policy document",
              headers: deprecationHeaders,
              content: {
                "application/json": {
                  schema: deprecationPolicySchema,
                },
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
              required: false,
              description: "Free-text query",
              schema: { type: "string" },
            },
            {
              name: "city",
              in: "query",
              required: false,
              description: "City filter",
              schema: { type: "string" },
            },
            {
              name: "guests",
              in: "query",
              required: false,
              description: "Guest count",
              schema: { type: "integer", minimum: 1 },
            },
            prettyParam,
            acceptParam,
          ],
          responses: {
            "200": {
              description: "Venue list",
              headers: deprecationHeaders,
              content: {
                "application/json": {
                  schema: venueListSchema,
                },
              },
            },
            "429": problemContent,
            "500": problemContent,
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
              required: false,
              description: "Free-text query",
              schema: { type: "string" },
            },
            {
              name: "category",
              in: "query",
              required: false,
              description: "Service category",
              schema: { type: "string" },
            },
            {
              name: "city",
              in: "query",
              required: false,
              description: "Service area / city",
              schema: { type: "string" },
            },
            prettyParam,
            acceptParam,
          ],
          responses: {
            "200": {
              description: "Service list",
              headers: deprecationHeaders,
              content: {
                "application/json": {
                  schema: serviceListSchema,
                },
              },
            },
            "429": problemContent,
            "500": problemContent,
          },
        },
      },
    },
    components: {
      schemas: {
        Problem: problemSchema,
        Venue: venueSchema,
        Service: serviceSchema,
        ApiIndexResponse: apiIndexSchema,
        HealthResponse: healthSchema,
        VenueListResponse: venueListSchema,
        ServiceListResponse: serviceListSchema,
        DeprecationPolicy: deprecationPolicySchema,
      },
      headers: deprecationHeaders,
    },
  };

  return Response.json(spec, {
    headers: {
      ...v1ResponseHeaders(),
      "Cache-Control": "public, max-age=300",
    },
  });
}
