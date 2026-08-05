"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

/** רקע קולנועי כהה — אירוע / אולם בלילה */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80";

function providersHref(category: string, secondary?: string): string {
  const params = new URLSearchParams({ category });
  if (secondary) params.set("secondary", secondary);
  return `/providers?${params.toString()}`;
}

function routeQuickSearch(raw: string): string {
  const q = raw.trim();
  if (!q) return "/halls";
  if (/הצעת.?נישואין|הצעות.?נישואין|proposal/i.test(q)) {
    return providersHref("תכנון וניהול אירוע", "הצעות נישואין");
  }
  if (/dj|די.?ג׳?יי|תקליט/i.test(q)) {
    return providersHref("מוזיקה ובמה", "DJ ותקליטנים");
  }
  if (/מגנט/i.test(q)) {
    return providersHref("צילום ותיעוד", "צלם מגנטים");
  }
  if (/צלם|צילום|וידאו/i.test(q)) {
    return providersHref("צילום ותיעוד");
  }
  if (/ברמן|ברמנים/i.test(q)) {
    return providersHref("צוותים ותפעול לאירוע", "ברמנים");
  }
  if (/מלצר|אבטח|לימוזין|הסע/i.test(q)) {
    return providersHref("צוותים ותפעול לאירוע");
  }
  if (/קייטרינג|שף|מזנון|קינוח|שולחן.?שוק/i.test(q)) {
    return providersHref("אוכל ומשקאות");
  }
  if (/בר\b|קוקטייל|אלכוהול/i.test(q)) {
    return providersHref("אוכל ומשקאות");
  }
  if (/איפור|שיער|כלה|יופי/i.test(q)) {
    return providersHref("יופי ואיפור");
  }
  if (/שמלה|חליפ|אופנה|הלבש/i.test(q)) {
    return providersHref("הלבשה ואופנה לאירוע");
  }
  if (/הזמנ|דפוס|קליגרפ/i.test(q)) {
    return providersHref("הזמנות ודפוס");
  }
  if (/טקס|רב|מוהל|עורך.?טקס/i.test(q)) {
    return providersHref("טקסים");
  }
  if (/אטרקצ|קוסם|ליצן|זיקוק|בידור/i.test(q)) {
    return providersHref("אטרקציות ובידור");
  }
  if (/הגבר|תאור|ציוד|אוהל|מסך.?led/i.test(q)) {
    return providersHref("ציוד ולוגיסטיקה");
  }
  if (/כנס|וובינר|תרגום.?סימולט|היבריד/i.test(q)) {
    return providersHref("אירועים עסקיים וכנסים");
  }
  if (/מתאם|הפקת.?אירוע|תכנון.?אירוע|מנהל.?אירוע/i.test(q)) {
    return providersHref("תכנון וניהול אירוע");
  }
  if (/עיצוב|פרח|קישוט|בלונ/i.test(q)) {
    return providersHref("עיצוב ומיתוג");
  }
  if (/זמר|להק|מוזיק|מנחה|mc/i.test(q)) {
    return providersHref("מוזיקה ובמה");
  }
  if (/אולם|גן.?אירוע|חתונה|צימר/i.test(q)) return "/halls";
  return `/halls?city=${encodeURIComponent(q)}`;
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      setReduce(
        mq.matches ||
          document.documentElement.classList.contains("a11y-stop-animations")
      );
    sync();
    mq.addEventListener("change", sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq.removeEventListener("change", sync);
      obs.disconnect();
    };
  }, []);
  return reduce;
}

export default function HomeHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const reduceMotion = usePrefersReducedMotion();

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(routeQuickSearch(query));
  }

  function scrollToDescend() {
    const el = document.getElementById("home-descend");
    el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <section
      className="home-hero-stage home-velune-hero relative min-h-[100svh] w-full overflow-hidden"
      aria-label="פתיחה"
    >
      <div className="home-hero-media absolute inset-0" aria-hidden>
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className={`object-cover ${reduceMotion ? "" : "home-hero-kenburns"}`}
        />
      </div>
      <div className="home-velune-hero__veil absolute inset-0" aria-hidden />

      <div className="relative z-[1] mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-24 pt-28 text-right sm:px-8 sm:pb-28 lg:px-10">
        <div className="home-animate-in home-hero-copy max-w-xl">
          <p className="home-velune-eyebrow">Halls Hub</p>
          <h1 className="home-velune-display mt-4 text-[2.35rem] font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            האירוע מתחיל
            <br />
            לפני הכניסה לאולם.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/78 sm:text-base">
            אולמות, צילום, מוזיקה, אוכל ועיצוב — במקום אחד, בלי לקפוץ בין עשרות
            אתרים.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/halls" className="home-velune-cta">
              התחילו לחפש
              <span className="home-velune-cta__icon" aria-hidden>
                ↓
              </span>
            </Link>
            <Link
              href="/providers"
              className="text-sm font-medium text-white/70 underline decoration-white/25 underline-offset-4 transition hover:text-white"
            >
              או חפשו ספקים
            </Link>
          </div>

          <form
            onSubmit={onSearch}
            className="home-animate-in home-stagger-2 mt-7 flex max-w-md overflow-hidden rounded-full border border-white/18 bg-black/25 p-1 backdrop-blur-md"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="עיר, DJ, צילום…"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none"
              aria-label="חיפוש מהיר"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
            >
              חיפוש
            </button>
          </form>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToDescend}
        className="home-velune-scroll-hint"
        aria-label="גללו להמשך"
      >
        <span>SCROLL TO DESCEND</span>
        <span className="home-velune-scroll-hint__line" aria-hidden />
      </button>

      <div
        className="home-velune-hero__rail pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/20"
        aria-hidden
      />
    </section>
  );
}
