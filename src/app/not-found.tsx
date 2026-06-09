import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";

export default function NotFound() {
  return (
    <SitePageShell bare>
      <main className="site-main-narrow px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-emerald-950">הדף לא נמצא</h1>
        <p className="mt-2 text-sm text-neutral-600">
          ייתכן שהקישור שגוי או שהדף הוסר.
        </p>
        <p className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/" className="font-semibold text-emerald-950 underline">
            דף הבית
          </Link>
          <Link href="/halls" className="font-semibold text-emerald-950 underline">
            חיפוש אולמות
          </Link>
          <Link href="/contact" className="font-semibold text-emerald-950 underline">
            יצירת קשר
          </Link>
        </p>
      </main>
    </SitePageShell>
  );
}
