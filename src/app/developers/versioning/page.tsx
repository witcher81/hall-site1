import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import { SITE_BRAND } from "@/lib/siteBrand";

export const metadata: Metadata = {
  title: `API versioning and deprecation — ${SITE_BRAND}`,
  description:
    "EventForYou public API versioning: URL path /api/v1, Deprecation and Sunset headers, and how breaking changes are introduced.",
  alternates: { canonical: "/developers/versioning" },
};

export default function ApiVersioningPage() {
  return (
    <SitePageShell>
      <article className="site-card-padded mx-auto max-w-3xl space-y-4 text-right text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-[var(--heading)]">
          {SITE_BRAND} API versioning & deprecation
        </h1>
        <p>
          ה-API הציבורי של {SITE_BRAND} מגרסא בנתיב URL: <code>/api/v1</code>.
          שינויים שוברים דורשים נתיב חדש <code>/api/v2</code>. לא משנים התנהגות
          שוברת בתוך v1 בלי תקופת הודעה.
        </p>
        <h2 className="text-lg font-semibold">כותרות</h2>
        <ul className="list-inside list-disc space-y-1" dir="ltr">
          <li>
            <code>API-Version: 1</code> — גרסה פעילה
          </li>
          <li>
            <code>Deprecation: false</code> — v1 אינה מופחתת כרגע. כשתופחת:{" "}
            <code>Deprecation: true</code>
          </li>
          <li>
            <code>Sunset</code> — תאריך HTTP-date מתי הגרסה תוסר, יישלח לפחות 90
            יום לפני כיבוי
          </li>
          <li>
            <code>Link: rel=&quot;deprecation&quot;</code> — מצביע לדף זה
          </li>
        </ul>
        <p>
          תיעוד:{" "}
          <Link href="/developers" className="underline">
            /developers
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
