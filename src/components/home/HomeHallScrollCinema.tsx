"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
} from "react";

/** ארבעה פרקים מסונכרנים — מסע ירידה */
const CHAPTERS = [
  {
    code: "01",
    label: "החלל",
    title: "אולם שמרגיש כמו שלכם.",
    text: "חלל, תאורה ואווירה — לפי סוג האירוע, הכמות והתקציב.",
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80",
    alt: "חתונה ואווירה",
  },
  {
    code: "02",
    label: "הטעם",
    title: "אוכל ובר שלא נשכחים.",
    text: "קייטרינג, עמדות, ברמנים וקוקטיילים — כל מה שמחזיק את האנרגיה.",
    src: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1920&q=80",
    alt: "קייטרינג ואוכל לאירוע",
  },
  {
    code: "03",
    label: "האנשים",
    title: "ספקים שכבר מבינים אירוע.",
    text: "צילום, מוזיקה, עיצוב ואטרקציות — משווים ומזמינים בלי להתפזר.",
    src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80",
    alt: "DJ ומסיבה",
  },
  {
    code: "04",
    label: "ההגעה",
    title: "מגיעים מעבר לרגיל.",
    text: "בונים חבילה או מתחילים בחיפוש — והשאר כבר מסודר במקום אחד.",
    src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1920&q=80",
    alt: "חגיגה ואירוע שמח",
  },
] as const;

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

function frameOpacity(progress: number, index: number, total: number): number {
  if (total <= 1) return 1;
  const pos = progress * (total - 1);
  const dist = Math.abs(pos - index);
  if (dist >= 1) return 0;
  return 1 - dist;
}

function chapterCopyOpacity(
  progress: number,
  index: number,
  total: number
): number {
  if (total <= 1) return 1;
  const pos = progress * (total - 1);
  const dist = Math.abs(pos - index);
  if (dist >= 0.55) return 0;
  return 1 - dist / 0.55;
}

export default function HomeHallScrollCinema() {
  const pinRef = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const syncFromScroll = useEffectEvent(() => {
    const pin = pinRef.current;
    if (!pin) return;
    const rect = pin.getBoundingClientRect();
    const total = pin.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const raw = -rect.top / total;
    const p = Math.max(0, Math.min(1, raw));
    setProgress(p);
    pin.style.setProperty("--scroll-p", p.toFixed(4));
  });

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        syncFromScroll();
      });
    };
    syncFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [reduceMotion]);

  const activeIndex = Math.min(
    CHAPTERS.length - 1,
    Math.round(progress * (CHAPTERS.length - 1))
  );
  const active = CHAPTERS[activeIndex];
  const lastIndex = CHAPTERS.length - 1;

  if (reduceMotion) {
    return (
      <section
        id="home-descend"
        className="home-hall-cinema home-hall-cinema--static"
        aria-label="סיור לאירועים"
      >
        <div className="home-hall-cinema__static-list">
          {CHAPTERS.map((ch) => (
            <article key={ch.code} className="home-hall-cinema__static-card">
              <div className="home-hall-cinema__static-media">
                <Image
                  src={ch.src}
                  alt={ch.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="text-right">
                <p className="home-journey-eyebrow">
                  {ch.code} — {ch.label}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">{ch.title}</h2>
                <p className="mt-2 text-sm text-white/75">{ch.text}</p>
              </div>
            </article>
          ))}
          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <Link
              href="/providers"
              className="inline-flex rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300"
            >
              חפש ספקים
            </Link>
            <Link
              href="/halls"
              className="inline-flex rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              חפש אולמות
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="home-descend"
      ref={pinRef}
      className="home-hall-cinema home-hall-cinema--journey"
      aria-label="סיור לאירועים — נע עם הגלילה"
      style={{ "--scroll-p": 0 } as CSSProperties}
    >
      <div className="home-hall-cinema__sticky">
        <div className="home-hall-cinema__stage">
          <div className="home-hall-cinema__frame home-hall-cinema__frame--descend">
            {CHAPTERS.map((ch, i) => {
              const opacity = frameOpacity(progress, i, CHAPTERS.length);
              return (
                <div
                  key={ch.src}
                  className="home-hall-cinema__shot"
                  style={{
                    opacity,
                    transform: `scale(${1.06 + progress * 0.1 + i * 0.012}) translateY(${(1 - progress) * -12}px)`,
                  }}
                  aria-hidden={i !== activeIndex}
                >
                  <Image
                    src={ch.src}
                    alt={ch.alt}
                    fill
                    sizes="100vw"
                    quality={85}
                    priority={i === 0}
                    className="object-cover"
                  />
                </div>
              );
            })}
            <div className="home-hall-cinema__vignette" aria-hidden />
            <div className="home-hall-cinema__depth" aria-hidden />
          </div>

          <div className="home-hall-cinema__copy home-hall-cinema__copy--journey text-right">
            {CHAPTERS.map((ch, i) => {
              const opacity = chapterCopyOpacity(progress, i, CHAPTERS.length);
              const isActive = i === activeIndex;
              return (
                <div
                  key={ch.code}
                  className="home-hall-cinema__chapter"
                  style={{
                    opacity,
                    pointerEvents: isActive ? "auto" : "none",
                    transform: `translateY(${(1 - opacity) * 16}px)`,
                  }}
                  aria-hidden={!isActive}
                >
                  <p className="home-journey-eyebrow">
                    {ch.code} — {ch.label}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                    {ch.title}
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-white/78 sm:text-base">
                    {ch.text}
                  </p>
                </div>
              );
            })}

            {progress > 0.82 ? (
              <div className="home-hall-cinema__cta mt-7 flex flex-wrap gap-3">
                <Link
                  href="/providers"
                  className="inline-flex rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300"
                >
                  חפש ספקים
                </Link>
                <Link
                  href="/halls"
                  className="inline-flex rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  חפש אולמות
                </Link>
              </div>
            ) : (
              <p className="home-hall-cinema__scroll-cue mt-7 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                גללו כדי לרדת · {active.code}
              </p>
            )}
          </div>

          <div className="home-journey-progress" aria-hidden>
            <span className="home-journey-progress__num">
              {String(activeIndex).padStart(2, "0")}
            </span>
            <div className="home-journey-progress__track">
              <span
                className="home-journey-progress__bar"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
            <span className="home-journey-progress__num">
              {String(lastIndex).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
