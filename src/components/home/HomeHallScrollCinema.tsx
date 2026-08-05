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

/** סיור לכל סוגי אירועים — לא רק חתונות */
const EVENT_FRAMES = [
  {
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&q=80",
    alt: "אולם אירועים עם תאורה",
  },
  {
    src: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1920&q=80",
    alt: "קייטרינג ואוכל לאירוע",
  },
  {
    src: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80",
    alt: "בר משקאות באירוע",
  },
  {
    src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1920&q=80",
    alt: "מסיבת יום הולדת",
  },
  {
    src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80",
    alt: "DJ ומסיבה",
  },
  {
    src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1920&q=80",
    alt: "חגיגה ואירוע שמח",
  },
] as const;

const STAGES = [
  {
    at: 0,
    title: "כל אירוע — במקום אחד",
    text: "חתונה, בר מצווה, חינה, יום הולדת, ברית או מסיבת רווקים.",
  },
  {
    at: 0.18,
    title: "אולם שמתאים לכם",
    text: "חלל, תאורה ואווירה — לפי סוג האירוע והכמות.",
  },
  {
    at: 0.36,
    title: "אוכל שמשאיר טעם",
    text: "קייטרינג, עמדות אוכל ותפריטים לכל סגנון.",
  },
  {
    at: 0.52,
    title: "בר ומשקאות",
    text: "ברמנים, קוקטיילים וברים שמרים את האנרגיה.",
  },
  {
    at: 0.68,
    title: "ימי הולדת ומסיבות",
    text: "מפעילים, אטרקציות ואווירה שגורמת לאנשים להישאר עד הסוף.",
  },
  {
    at: 0.84,
    title: "מוכנים להתחיל?",
    text: "חפשו אולם או ספק — והשוו הצעות בקלות.",
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

  return (
    <section
      ref={pinRef}
      className="home-hall-cinema"
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
                    transform: `scale(${1.04 + progress * 0.08 + i * 0.01})`,
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
            <div className="home-hall-cinema__depth" aria-hidden />
          </div>

          <div className="home-hall-cinema__copy text-right">
            <p className="text-xs font-semibold tracking-[0.28em] text-amber-300/90">
              לכל אירוע
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {activeStage.title}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
              {activeStage.text}
            </p>
            {progress > 0.8 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/packages/build"
                  className="inline-flex rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300"
                >
                  בנו לי חבילה
                </Link>
                <Link
                  href="/halls"
                  className="inline-flex rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  חפש אולמות
                </Link>
              </div>
            ) : (
              <p className="mt-6 text-xs text-white/55">
                גללו למטה — הסיור זז איתכם
              </p>
            )}
          </div>

          <div className="home-hall-cinema__progress" aria-hidden>
            <span
              className="home-hall-cinema__progress-bar"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
