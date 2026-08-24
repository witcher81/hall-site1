export type McpToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const MCP_TOOLS: McpToolDef[] = [
  {
    name: "search_halls",
    description:
      "Search public EventForYou venues (halls) by city, free-text query, and/or guest count.",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name in Hebrew or Latin" },
        q: { type: "string", description: "Free-text query" },
        guests: { type: "integer", description: "Number of guests" },
      },
    },
  },
  {
    name: "get_venue",
    description: "Get a single public venue by numeric id.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Venue id" },
      },
      required: ["id"],
    },
  },
  {
    name: "search_services",
    description: "Search public freelancer services on EventForYou.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        category: { type: "string" },
        city: { type: "string" },
      },
    },
  },
  {
    name: "get_service",
    description: "Get a single public service by numeric id.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_provider",
    description: "Get a public freelancer provider profile by user id.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_site_overview",
    description:
      "Return EventForYou when-to-use guidance and canonical public URLs (llms, about, contact, MCP).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];
