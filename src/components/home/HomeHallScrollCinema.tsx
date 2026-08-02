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

/** תמונות HD של אולמות / קבלות פנים — נעות עם הגלילה כמו סיור */
const HALL_FRAMES = [
  {
    src: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1920&q=80",
    alt: "אולם אירועים מעוצב",
  },
  {
    src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1920&q=80",
    alt: "שולחנות ערוכים באולם",
  },
  {
    src: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=1920&q=80",
    alt: "קבלת פנים באולם",
  },
  {
    src: "https://images.unsplash.com/photo-1511285560929-80b456fe0c7f?auto=format&fit=crop&w=1920&q=80",
    alt: "עיצוב שולחן לאירוע",
  },
  {
    src: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1920&q=80",
    alt: "סידור כסאות באולם",
  },
  {
    src: "https://images.unsplash.com/photo-1520854221259-1862dad10a21?auto=format&fit=crop&w=1920&q=80",
    alt: "אווירת אירוע באולם",
  },
] as const;

const STAGES = [
  {
    at: 0,
    title: "נכנסים לאולם",
    text: "גוללים ומגלים את האווירה — כאילו אתם בסיור אמיתי.",
  },
  {
    at: 0.22,
    title: "החלל מתגלה",
    text: "תאורה, שולחנות ועיצוב — כל מה שחשוב לבחירה.",
  },
  {
    at: 0.45,
    title: "מרגישים את האירוע",
    text: "ככה נראה הרגע לפני שהאורחים נכנסים.",
  },
  {
    at: 0.68,
    title: "פרטים שעושים הבדל",
    text: "מסידור הכסאות ועד האווירה הכללית.",
  },
  {
    at: 0.85,
    title: "מוכנים לבחור?",
    text: "עברו לחיפוש אולמות והתחילו להשוות.",
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
    HALL_FRAMES.length - 1,
    Math.round(progress * (HALL_FRAMES.length - 1))
  );

  return (
    <section
      ref={pinRef}
      className="home-hall-cinema"
      aria-label="סיור באולם — נע עם הגלילה"
      style={{ "--scroll-p": 0 } as CSSProperties}
    >
      <div className="home-hall-cinema__sticky">
        <div className="home-hall-cinema__stage">
          <div className="home-hall-cinema__frame">
            {HALL_FRAMES.map((frame, i) => {
              const opacity = reduceMotion
                ? i === 0
                  ? 1
                  : 0
                : frameOpacity(progress, i, HALL_FRAMES.length);
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
              סיור באולם
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {activeStage.title}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
              {activeStage.text}
            </p>
            {progress > 0.78 ? (
              <Link
                href="/halls"
                className="mt-6 inline-flex rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300"
              >
                חפש אולמות
              </Link>
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
