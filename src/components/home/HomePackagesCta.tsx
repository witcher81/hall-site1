import Link from "next/link";

export default function HomePackagesCta() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-l from-amber-50 via-white to-emerald-50 p-8 text-right shadow-lg sm:p-10">
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          האתר בונה לכם את החבילה
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
          אומרים איזה אירוע, איפה וכמה אורחים — ומקבלים חבילות מוכנות: אולם +
          ספקים שמתאימים (למשל יום הולדת עם מפעיל).
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/packages/build"
            className="inline-flex rounded-full bg-neutral-900 px-7 py-3 text-sm font-bold text-amber-200 transition hover:bg-emerald-950"
          >
            בנו לי חבילות
          </Link>
          <Link
            href="/packages"
            className="inline-flex rounded-full border border-neutral-300 bg-white/80 px-7 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-white"
          >
            קטלוג חבילות
          </Link>
        </div>
      </div>
    </section>
  );
}
