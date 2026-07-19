"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

/** תמונת hero — רוחב סביר למובייל/דסקטופ, לא 2400px */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=75";

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
  if (/קייטרינג|שף|מזנון|קינוח/i.test(q)) {
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

export default function HomeHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(routeQuickSearch(query));
  }

  return (
    <section className="relative min-h-[min(88vh,720px)] w-full overflow-hidden">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="object-cover scale-105"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-neutral-950/90"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[min(88vh,720px)] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="home-animate-in max-w-2xl text-right">
          <p className="text-xs font-semibold tracking-[0.35em] text-amber-300/90">
            HALLS HUB
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            בונים אירוע?
            <br />
            <span className="text-amber-200/95">
              מוצאים אולם, DJ, צלם, מעצב ועוד — במקום אחד
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80">
            מרקטפלייס לאירועים: חיפוש, השוואה ובקשות — בלי לקפוץ בין עשרות אתרים.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/halls"
              className="home-animate-in home-stagger-1 rounded-full bg-amber-400 px-8 py-3.5 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              חפש אולמות
            </Link>
            <Link
              href="/providers"
              className="home-animate-in home-stagger-2 rounded-full border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              חפש ספקים
            </Link>
          </div>

          <form
            onSubmit={onSearch}
            className="home-animate-in home-stagger-3 mt-8 flex max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="מה אתם מחפשים? עיר, DJ, צילום..."
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none"
              aria-label="חיפוש מהיר"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-amber-50"
            >
              חיפוש
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
