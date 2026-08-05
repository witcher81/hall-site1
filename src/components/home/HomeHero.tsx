"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  PointerEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
} from "react";

/** Hero backgrounds — cinematic carousel */
const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1920&q=80",
    alt: "wedding couple",
  },
  {
    src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1920&q=80",
    alt: "elegant tables",
  },
  {
    src: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1920&q=80",
    alt: "bride",
  },
  {
    src: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1920&q=80",
    alt: "stage lights",
  },
  {
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80",
    alt: "fine dining",
  },
  {
    src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1920&q=80",
    alt: "banquet hall",
  },
] as const;

const HERO_ROTATE_MS = 5000;

const FLOAT_CARD_SETS: ReadonlyArray<
  ReadonlyArray<{ label: string; hint: string; depth: number }>
> = [
  [
    { label: "אולמות", hint: "חללים לאירוע", depth: 1.15 },
    { label: "DJ", hint: "מוזיקה חיה", depth: 0.85 },
    { label: "צלמים", hint: "תיעוד מקצועי", depth: 1.35 },
  ],
  [
    { label: "קייטרינג", hint: "אוכל לאירוע", depth: 1.1 },
    { label: "ברמנים", hint: "בר ומשקאות", depth: 0.9 },
    { label: "עיצוב", hint: "פרחים וקישוט", depth: 1.3 },
  ],
  [
    { label: "יום הולדת", hint: "מפעיל ואטרקציות", depth: 1.2 },
    { label: "בר מצווה", hint: "אולם + מוזיקה", depth: 0.95 },
    { label: "חינה", hint: "אווירה ועיצוב", depth: 1.25 },
  ],
  [
    { label: "חבילות", hint: "האתר בונה בשבילכם", depth: 1.15 },
    { label: "מגנטים", hint: "צילום לאורחים", depth: 0.88 },
    { label: "זמרים", hint: "במה חיה", depth: 1.32 },
  ],
];

const FLOAT_ROTATE_MS = 3800;

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

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      setReduce(
        mq.matches || document.documentElement.classList.contains("a11y-stop-animations")
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
  const [bgIndex, setBgIndex] = useState(0);
  const [floatSetIndex, setFloatSetIndex] = useState(0);
  const [floatVisible, setFloatVisible] = useState(true);
  const stageRef = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const applyScene = useEffectEvent((x: number, y: number) => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty("--hx", x.toFixed(4));
    el.style.setProperty("--hy", y.toFixed(4));
  });

  useEffect(() => {
    if (reduceMotion) {
      applyScene(0, 0);
      return;
    }

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      applyScene(current.current.x, current.current.y);
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setFloatVisible(true);
      return;
    }
    let fadeTimer: number | null = null;
    const rotateTimer = window.setInterval(() => {
      setFloatVisible(false);
      fadeTimer = window.setTimeout(() => {
        setFloatSetIndex((i) => (i + 1) % FLOAT_CARD_SETS.length);
        setFloatVisible(true);
      }, 280);
    }, FLOAT_ROTATE_MS);
    return () => {
      window.clearInterval(rotateTimer);
      if (fadeTimer != null) window.clearTimeout(fadeTimer);
    };
  }, [reduceMotion]);


  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setInterval(() => {
      setBgIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, HERO_ROTATE_MS);
    return () => window.clearInterval(t);
  }, [reduceMotion]);

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (reduceMotion) return;
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    target.current = {
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny)),
    };
  }

  function onPointerLeave() {
    target.current = { x: 0, y: 0 };
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(routeQuickSearch(query));
  }

  return (
    <section
      ref={stageRef}
      className="home-hero-stage relative min-h-[min(88vh,720px)] w-full overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ "--hx": 0, "--hy": 0 } as CSSProperties}
    >
      <div className="home-hero-media absolute inset-0" aria-hidden>
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img.src}
            className={`home-hero-slide ${i === bgIndex ? "is-active" : ""}`}
          >
            <Image
              src={img.src}
              alt=""
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "auto"}
              sizes="100vw"
              className={`object-cover ${reduceMotion ? "" : "home-hero-kenburns"}`}
            />
          </div>
        ))}
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-neutral-950/90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(251,191,36,0.14),transparent_55%)]"
        aria-hidden
      />
      <div className="home-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="home-hero-orb home-hero-orb--a" aria-hidden />
      <div className="home-hero-orb home-hero-orb--b" aria-hidden />

      <div className="relative mx-auto flex min-h-[min(88vh,720px)] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
          <div className="home-animate-in home-hero-copy max-w-2xl text-right">
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
                className="home-animate-in home-stagger-1 home-hero-cta rounded-full bg-amber-400 px-8 py-3.5 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300"
              >
                חפש אולמות
              </Link>
              <Link
                href="/providers"
                className="home-animate-in home-stagger-2 home-hero-cta rounded-full border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                חפש ספקים
              </Link>
            </div>

            <form
              onSubmit={onSearch}
              className="home-animate-in home-stagger-3 home-search-glow mt-8 flex max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-xl"
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

          <div
            className="home-hero-float-stage home-animate-in home-stagger-2 relative mx-auto hidden h-[320px] w-full max-w-md lg:block"
            aria-hidden
          >
            <div
              className={`home-hero-float-swap ${floatVisible ? "is-visible" : ""}`}
            >
              {FLOAT_CARD_SETS[floatSetIndex].map((card, i) => (
                <div
                  key={`${floatSetIndex}-${card.label}`}
                  className={`home-hero-float-card home-hero-float-card--${i + 1}`}
                  style={{ "--depth": card.depth } as CSSProperties}
                >
                  <span className="text-sm font-bold text-white">{card.label}</span>
                  <span className="mt-1 block text-[11px] text-white/65">
                    {card.hint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const el = document.getElementById("home-descend");
          el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        }}
        className="home-journey-scroll-hint"
        aria-label="גללו להמשך הסיור"
      >
        <span>SCROLL TO DESCEND</span>
        <span className="home-journey-scroll-hint__line" aria-hidden />
      </button>

    </section>
  );
}
