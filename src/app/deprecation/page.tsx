import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import { SITE_BRAND } from "@/lib/siteBrand";

export const metadata: Metadata = {
  title: `Deprecation and Sunset policy — ${SITE_BRAND} API`,
  description:
    "EventForYou public API Deprecation and Sunset policy: URL versioning /api/v1, Deprecation header, Sunset HTTP-date, 90-day notice before removal.",
  alternates: { canonical: "/deprecation" },
};

export default function DeprecationPolicyPage() {
  return (
    <SitePageShell>
      <article className="site-card-padded mx-auto max-w-3xl space-y-4 text-right text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-[var(--heading)]">
          {SITE_BRAND} — Deprecation & Sunset policy
        </h1>
        <p dir="ltr" className="text-left">
          Machine-readable policy also at{" "}
          <a className="underline" href="/api/v1/deprecation">
            GET /api/v1/deprecation
          </a>
          .
        </p>
        <h2 className="text-lg font-semibold">Versioning</h2>
        <p>
          Public API versions live in the URL path (<code>/api/v1</code>). Breaking
          changes require a new major path (<code>/api/v2</code>). Non-breaking
          additive changes may ship inside the current major version.
        </p>
        <h2 className="text-lg font-semibold">Deprecation header (RFC 9745)</h2>
        <p dir="ltr" className="text-left">
          Active versions send <code>Deprecation: false</code>. When a version is
          deprecated, responses send <code>Deprecation: true</code> (or a
          deprecation date) on every response for that version.
        </p>
        <h2 className="text-lg font-semibold">Sunset header (RFC 8594)</h2>
        <p dir="ltr" className="text-left">
          Deprecated versions also send a <code>Sunset</code> HTTP-date at least{" "}
          <strong>90 days</strong> before the version is removed. Until
          deprecation is announced, no <code>Sunset</code> header is sent on
          success responses (v1 is not scheduled for removal).
        </p>
        <h2 className="text-lg font-semibold">Link relations</h2>
        <ul className="list-inside list-disc space-y-1" dir="ltr">
          <li>
            <code>rel=&quot;deprecation&quot;</code> → this page
          </li>
          <li>
            <code>rel=&quot;status&quot;</code> →{" "}
            <code>/api/v1/deprecation</code>
          </li>
        </ul>
        <p>
          Related:{" "}
          <Link href="/developers/versioning" className="underline">
            /developers/versioning
          </Link>
          {" · "}
          <Link href="/docs" className="underline">
            /docs
          </Link>
          {" · "}
          <Link href="/openapi.json" className="underline">
            OpenAPI
          </Link>
        </p>
      </article>
    </SitePageShell>
  );
}
