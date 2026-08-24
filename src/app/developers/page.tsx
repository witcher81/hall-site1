import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import { SITE_BRAND } from "@/lib/siteBrand";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: `Developers — ${SITE_BRAND}`,
  description:
    "EventForYou developer resources: public APIs, OpenAPI, MCP server, llms.txt, and agent guidance.",
  alternates: { canonical: "/developers" },
};

export default function DevelopersPage() {
  const base = getSiteUrl();

  return (
    <SitePageShell>
      <article className="site-card-padded mx-auto max-w-3xl space-y-5 text-right text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-[var(--heading)]">
          {SITE_BRAND} — Developers & AI agents
        </h1>
        <p dir="ltr" className="text-left text-[var(--muted)]">
          Public, read-only surfaces for discovering venues, services, and site
          guidance. No API key required for machine-readable docs and MCP discovery.
        </p>

        <h2 className="text-lg font-semibold text-[var(--heading)]">
          When to use {SITE_BRAND}
        </h2>
        <p>
          השתמשו ב-{SITE_BRAND} כשסוכן או אפליקציה צריכים לעזור למשתמש למצוא אולם
          אירועים, ספק שירות או חבילת אירוע בישראל; להשוות אפשרויות ציבוריות; או
          לקבל קישורים לדפי אמון (אודות, יצירת קשר, פרטיות).
        </p>

        <h2 className="text-lg font-semibold text-[var(--heading)]">Machine-readable</h2>
        <ul className="list-inside list-disc space-y-2" dir="ltr">
          <li>
            <a className="underline" href={`${base}/llms.txt`}>
              /llms.txt
            </a>{" "}
            — agent instructions
          </li>
          <li>
            <a className="underline" href={`${base}/sitemap.xml`}>
              /sitemap.xml
            </a>
          </li>
          <li>
            <a className="underline" href={`${base}/.well-known/mcp`}>
              /.well-known/mcp
            </a>{" "}
            — MCP discovery
          </li>
          <li>
            <a className="underline" href={`${base}/mcp`}>
              /mcp
            </a>{" "}
            — Streamable HTTP MCP endpoint
          </li>
          <li>
            <a className="underline" href={`${base}/openapi.json`}>
              /openapi.json
            </a>{" "}
            — public OpenAPI sketch
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-[var(--heading)]">Public HTTP APIs</h2>
        <ul className="list-inside list-disc space-y-2" dir="ltr">
          <li>
            <code>GET /api/venues</code> — search public venues
          </li>
          <li>
            <code>GET /api/services/public</code> — search public services
          </li>
          <li>
            <code>GET /api/packages/[id]</code> — public package detail (when available)
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
        </p>
      </article>
    </SitePageShell>
  );
}
