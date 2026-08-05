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

const EVENT_FRAMES = [
  {
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&q=80",
    alt: "אולם אירועים עם תאורה",
  },
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80",
    alt: "חתונה ואווירה",
  },
  {
    src: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1920&q=80",
    alt: "קייטרינג ואוכל לאירוע",
  },
  {
    src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80",
    alt: "DJ ומסיבה",
  },
] as const;

const STAGES = [
  {
    at: 0,
    code: "01",
    label: "התחלה",
    title: "העיר מחכה מתחת לעננים.",
    text: "חתונה, בר מצווה, חינה או יום הולדת — הכל מתחיל בבחירה אחת ברורה.",
  },
  {
    at: 0.28,
    code: "02",
    label: "החלל",
    title: "אולם שמרגיש כמו שלכם.",
    text: "חלל, תאורה ואווירה — לפי סוג האירוע, הכמות והתקציב.",
  },
  {
    at: 0.55,
    code: "03",
    label: "האנשים",
    title: "ספקים שכבר מבינים אירוע.",
    text: "צילום, מוזיקה, אוכל ועיצוב — משווים ומזמינים בלי להתפזר.",
  },
  {
    at: 0.8,
    code: "04",
    label: "הגעה",
    title: "מגיעים מעבר לרגיל.",
    text: "בונים חבילה או מתחילים בחיפוש — והשאר כבר מסודר במקום אחד.",
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

  const activeStage =
    [...STAGES].reverse().find((s) => progress >= s.at) ?? STAGES[0];
  const activeFrame = Math.min(
    EVENT_FRAMES.length - 1,
    Math.round(progress * (EVENT_FRAMES.length - 1))
  );
  const stageIndex = STAGES.findIndex((s) => s.code === activeStage.code);

  return (
    <section
      id="home-descend"
      ref={pinRef}
      className="home-hall-cinema home-velune-cinema"
      aria-label="סיור לאירועים — נע עם הגלילה"
      style={{ "--scroll-p": 0 } as CSSProperties}
    >
      <div className="home-hall-cinema__sticky">
        <div className="home-hall-cinema__stage">
          <div className="home-hall-cinema__frame">
            {EVENT_FRAMES.map((frame, i) => {
              const opacity = reduceMotion
                ? i === 0
                  ? 1
                  : 0
                : frameOpacity(progress, i, EVENT_FRAMES.length);
              return (
                <div
                  key={frame.src}
                  className="home-hall-cinema__shot"
                  style={{
                    opacity,
                    transform: `scale(${1.04 + progress * 0.06 + i * 0.008})`,
                  }}
                  aria-hidden={i !== activeFrame}
                >
                  <Image
                    src={frame.src}
                    alt={frame.alt}
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
          </div>

          <div className="home-hall-cinema__copy home-velune-cinema__copy text-right">
            <p className="home-velune-eyebrow home-velune-eyebrow--lite">
              {activeStage.code} — {activeStage.label}
            </p>
            <h2 className="home-velune-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              {activeStage.title}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/78 sm:text-base">
              {activeStage.text}
            </p>
            {progress > 0.82 ? (
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/packages/build" className="home-velune-cta">
                  בנו לי חבילה
                  <span className="home-velune-cta__icon" aria-hidden>
                    →
                  </span>
                </Link>
                <Link
                  href="/halls"
                  className="rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/18"
                >
                  חפש אולמות
                </Link>
              </div>
            ) : (
              <p className="mt-7 text-[11px] uppercase tracking-[0.22em] text-white/45">
                גללו כדי לרדת
              </p>
            )}
          </div>

          <div className="home-velune-cinema__progress" aria-hidden>
            <span className="home-velune-cinema__progress-num">
              {String(stageIndex).padStart(2, "0")}
            </span>
            <div className="home-velune-cinema__progress-track">
              <span
                className="home-velune-cinema__progress-bar"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
            <span className="home-velune-cinema__progress-num">
              {String(STAGES.length - 1).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
