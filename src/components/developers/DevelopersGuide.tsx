import Link from "next/link";
import { SITE_BRAND } from "@/lib/siteBrand";
import { getSiteUrl } from "@/lib/siteUrl";

export default function DevelopersGuide() {
  const base = getSiteUrl();

  return (
    <article className="site-card-padded mx-auto max-w-3xl space-y-5 text-right text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold text-[var(--heading)]">
        {SITE_BRAND} (EventForYou) — Developers, API & AI agents
      </h1>
      <p dir="ltr" className="text-left text-[var(--muted)]">
        Public developer resources for EventForYou at hall-site1.vercel.app: REST API
        docs, OpenAPI, auth (none required for public read), webhooks (inbound, private),
        and MCP server. No API key for machine-readable docs and public search.
      </p>

      <h2 className="text-lg font-semibold text-[var(--heading)]">
        When to use {SITE_BRAND} (EventForYou)
      </h2>
      <p>
        השתמשו ב-{SITE_BRAND} כשסוכן או אפליקציה צריכים לעזור למשתמש למצוא אולם
        אירועים, ספק שירות או חבילת אירוע בישראל; להשוות אפשרויות ציבוריות; או
        לקבל קישורים לדפי אמון (אודות, יצירת קשר, פרטיות).
      </p>

      <h2 className="text-lg font-semibold text-[var(--heading)]">Authentication</h2>
      <p dir="ltr" className="text-left">
        Public GET /api/v1/* requires no credentials. Authenticated product APIs
        (inquiries, dashboards) use session cookies and are not for third-party
        agents. Inbound webhooks use WEBHOOK_INBOUND_SECRET (private).
      </p>
      <p dir="ltr" className="text-left">
        Example: <code>curl -s &quot;{base}/api/v1/venues?city=Tel%20Aviv&quot;</code>
      </p>

      <h2 className="text-lg font-semibold text-[var(--heading)]">Machine-readable</h2>
      <ul className="list-inside list-disc space-y-2" dir="ltr">
        <li>
          <a className="underline" href={`${base}/llms.txt`}>
            /llms.txt
          </a>
        </li>
        <li>
          <a className="underline" href={`${base}/docs`}>
            /docs
          </a>{" "}
          ·{" "}
          <a className="underline" href={`${base}/developers`}>
            /developers
          </a>
        </li>
        <li>
          <a className="underline" href={`${base}/developers/versioning`}>
            /developers/versioning
          </a>{" "}
          — deprecation / Sunset policy
        </li>
        <li>
          <a className="underline" href={`${base}/.well-known/mcp`}>
            /.well-known/mcp
          </a>{" "}
          ·{" "}
          <a className="underline" href={`${base}/.well-known/mcp.json`}>
            /.well-known/mcp.json
          </a>{" "}
          ·{" "}
          <a className="underline" href={`${base}/.well-known/mcp/server-card.json`}>
            server-card.json
          </a>
        </li>
        <li>
          <a className="underline" href={`${base}/mcp`}>
            /mcp
          </a>{" "}
          — Streamable HTTP (POST initialize handshake)
        </li>
        <li>
          <a className="underline" href={`${base}/openapi.json`}>
            /openapi.json
          </a>
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-[var(--heading)]">Public HTTP APIs (v1)</h2>
      <ul className="list-inside list-disc space-y-2" dir="ltr">
        <li>
          <code>GET /api</code> — catalog
        </li>
        <li>
          <code>GET /api/v1</code> — API index + versioning policy
        </li>
        <li>
          <code>GET /api/v1/venues</code> — searchVenuesV1
        </li>
        <li>
          <code>GET /api/v1/services</code> — searchServicesV1
        </li>
        <li>
          <code>GET /api/v1/health</code> — healthV1
        </li>
        <li>
          Errors: <code>application/problem+json</code> with <code>code</code> +{" "}
          <code>hint</code>
        </li>
      </ul>

      <p>
        דפי מוצר:{" "}
        <Link href="/halls" className="underline">
          אולמות
        </Link>
        {" · "}
        <Link href="/providers" className="underline">
          ספקים
        </Link>
        {" · "}
        <Link href="/packages" className="underline">
          חבילות
        </Link>
        {" · "}
        <Link href="/about" className="underline">
          אודות
        </Link>
        {" · "}
        <Link href="/privacy" className="underline">
          פרטיות
        </Link>
      </p>
    </article>
  );
}
