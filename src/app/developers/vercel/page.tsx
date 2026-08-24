import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import { SITE_BRAND } from "@/lib/siteBrand";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: `EventForYou on Vercel — developer resources, API, OpenAPI, MCP`,
  description:
    "EventForYou (hall-site1.vercel.app) developer resources on Vercel: public REST API, OpenAPI, MCP server card, llms.txt, auth and webhook notes.",
  alternates: { canonical: "/developers/vercel" },
};

/**
 * Name-based discoverability when agents search "vercel" + this host.
 * Product brand is EventForYou; hosting is Vercel.
 */
export default function EventForYouOnVercelPage() {
  const base = getSiteUrl();
  return (
    <SitePageShell>
      <article className="site-card-padded mx-auto max-w-3xl space-y-4 text-right text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-[var(--heading)]">
          EventForYou on Vercel — developer resources
        </h1>
        <p dir="ltr" className="text-left text-[var(--muted)]">
          This is the EventForYou product (Israeli event marketplace) deployed on
          Vercel at <strong>hall-site1.vercel.app</strong>. Developer resources
          below belong to EventForYou, not to the Vercel platform itself.
        </p>

        <h2 className="text-lg font-semibold text-[var(--heading)]">
          Public APIs and docs
        </h2>
        <ul className="list-inside list-disc space-y-2" dir="ltr">
          <li>
            <a className="underline" href={`${base}/docs`}>
              {base}/docs
            </a>{" "}
            — EventForYou API documentation
          </li>
          <li>
            <a className="underline" href={`${base}/developers`}>
              {base}/developers
            </a>
          </li>
          <li>
            <a className="underline" href={`${base}/openapi.json`}>
              OpenAPI
            </a>
          </li>
          <li>
            <a className="underline" href={`${base}/api/v1`}>
              GET /api/v1
            </a>
          </li>
          <li>
            Auth: public GET /api/v1/* needs no API key. Product session cookies
            are for the human UI only. Inbound webhooks use a private secret.
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-[var(--heading)]">
          MCP on this Vercel deployment
        </h2>
        <ul className="list-inside list-disc space-y-2" dir="ltr">
          <li>
            Server card:{" "}
            <a className="underline" href={`${base}/.well-known/mcp`}>
              /.well-known/mcp
            </a>
          </li>
          <li>
            Registry:{" "}
            <a className="underline" href={`${base}/server.json`}>
              /server.json
            </a>
          </li>
          <li>
            Streamable HTTP:{" "}
            <a className="underline" href={`${base}/mcp`}>
              /mcp
            </a>
          </li>
          <li>
            <a className="underline" href={`${base}/llms.txt`}>
              /llms.txt
            </a>
          </li>
        </ul>

        <p>
          Brand landing:{" "}
          <Link href="/eventforyou" className="underline">
            /eventforyou
          </Link>
          {" · "}
          <Link href="/" className="underline">
            home
          </Link>
        </p>
      </article>
    </SitePageShell>
  );
}
