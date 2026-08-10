import Link from "next/link";
import Image from "next/image";

const EVENT_SHORTCUTS = [
  {
    label: "יום הולדת",
    href: "/packages/build?eventType=" + encodeURIComponent("יום הולדת"),
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=75",
  },
  {
    label: "בר / בת מצווה",
    href:
      "/packages/build?eventType=" +
      encodeURIComponent("בר מצווה / בת מצווה"),
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75",
  },
  {
    label: "חתונה",
    href: "/packages/build?eventType=" + encodeURIComponent("חתונה"),
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=75",
  },
  {
    label: "חינה",
    href: "/packages/build?eventType=" + encodeURIComponent("חינה"),
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=75",
  },
  {
    label: "רווקים / רווקות",
    href:
      "/packages/build?eventType=" +
      encodeURIComponent("מסיבת רווקים / רווקות"),
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=75",
  },
  {
    label: "ברית",
    href:
      "/packages/build?eventType=" + encodeURIComponent("ברית / בריתה"),
    image:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=75",
  },
] as const;

export default function PackagesPageHero() {
  return (
    <section className="packages-hero relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-neutral-950 text-right shadow-xl">
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=75"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/70 to-black/45" />
      </div>

      <div className="relative px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <p className="text-xs font-semibold tracking-[0.28em] text-amber-300/90">
          EVENT FOR YOU
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          האתר בונה לכם את החבילה
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
          אומרים איזה אירוע, איפה וכמה אורחים — ומקבלים אולם + ספקים שמתאימים.
          בלי להרכיב הכל לבד.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/packages/build"
            className="inline-flex rounded-full bg-amber-400 px-8 py-3.5 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            בנו לי חבילות עכשיו
          </Link>
          <a
            href="#packages-catalog"
            className="inline-flex rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
          >
            לעיון בקטלוג
          </a>
        </div>

        <div className="mt-10">
          <p className="text-xs font-semibold text-white/70">התחילו לפי סוג אירוע</p>
          <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {EVENT_SHORTCUTS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group relative block overflow-hidden rounded-2xl border border-white/15 shadow-md transition hover:-translate-y-0.5 hover:border-amber-300/50"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 160px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-2 text-center text-[11px] font-bold leading-tight text-white sm:p-2.5 sm:text-sm">
                      {item.label}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
