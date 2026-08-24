import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";

export default function NotFound() {
  return (
    <SitePageShell bare>
      <main className="site-main-narrow px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-emerald-950">הדף לא נמצא</h1>
        <p className="mt-2 text-sm text-neutral-600">
          ייתכן שהקישור שגוי או שהדף הוסר. נתיב זה אינו קיים באתר EventForYou.
        </p>
        <p className="mt-4 text-sm text-neutral-700">
          לאן להמשיך: דף הבית, חיפוש אולמות, יצירת קשר, אודות, מפת האתר למכונות,
          או קובץ ההנחיות לסוכנים.
        </p>
        <p className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/" className="font-semibold text-emerald-950 underline">
            דף הבית
          </Link>
          <Link href="/halls" className="font-semibold text-emerald-950 underline">
            חיפוש אולמות
          </Link>
          <Link href="/about" className="font-semibold text-emerald-950 underline">
            אודות
          </Link>
          <Link href="/contact" className="font-semibold text-emerald-950 underline">
            יצירת קשר
          </Link>
          <Link
            href="/developers"
            className="font-semibold text-emerald-950 underline"
          >
            Developers
          </Link>
          <Link
            href="/llms.txt"
            className="font-semibold text-emerald-950 underline"
          >
            llms.txt
          </Link>
          <Link
            href="/sitemap.xml"
            className="font-semibold text-emerald-950 underline"
          >
            sitemap.xml
          </Link>
        </p>
        {/* Agent-oriented recovery hints (also visible in HTML source) */}
        <pre className="mx-auto mt-8 max-w-lg whitespace-pre-wrap rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left text-xs text-neutral-700" dir="ltr">
{`# 404 — EventForYou
This path does not exist.
Try next:
- / (home)
- /halls (search venues)
- /providers (search services)
- /packages (event packages)
- /about /contact /privacy
- /llms.txt
- /sitemap.xml
- /developers
- /.well-known/mcp`}
        </pre>
      </main>
    </SitePageShell>
  );
}
