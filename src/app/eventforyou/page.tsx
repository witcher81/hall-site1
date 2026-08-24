import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";

export const metadata: Metadata = {
  title: `EventForYou official site — halls, services, packages`,
  description:
    "Official EventForYou website (hall-site1.vercel.app): Israeli event marketplace for venues, freelancers, and packages. Developer docs, OpenAPI, and MCP.",
  alternates: { canonical: "/eventforyou" },
};

/** Brand landing for name-based discovery (EventForYou → this domain). */
export default function EventForYouBrandPage() {
  const base = getSiteUrl();
  return (
    <SitePageShell>
      <article className="site-card-padded mx-auto max-w-3xl space-y-4 text-right text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-[var(--heading)]">
          EventForYou — האתר הרשמי
        </h1>
        <p>
          זהו האתר הרשמי של <strong>EventForYou</strong> ({SITE_BRAND}) בכתובת{" "}
          <a className="underline" href={base} dir="ltr">
            {base}
          </a>
          . EventForYou הוא מרקטפלייס ישראלי לאולמות אירועים, ספקי שירותים
          וחבילות אירוע.
        </p>
        <h2 className="text-lg font-semibold">קישורים</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <Link href="/" className="underline">
              דף הבית
            </Link>
          </li>
          <li>
            <Link href="/developers" className="underline">
              EventForYou Developers
            </Link>
          </li>
          <li>
            <Link href="/docs" className="underline">
              EventForYou API docs
            </Link>
          </li>
          <li>
            <a className="underline" href={`${base}/openapi.json`}>
              OpenAPI
            </a>
          </li>
          <li>
            <a className="underline" href={`${base}/.well-known/mcp`}>
              MCP
            </a>
          </li>
        </ul>
      </article>
    </SitePageShell>
  );
}
