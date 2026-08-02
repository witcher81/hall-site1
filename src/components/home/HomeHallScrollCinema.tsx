"use client";

import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const STAGES = [
  {
    at: 0,
    title: "נכנסים לאולם",
    text: "גוללים ומגלים את האווירה — כאילו אתם בסיור אמיתי.",
  },
  {
    at: 0.28,
    title: "החלל מתגלה",
    text: "תאורה, במה, שולחנות — כל פרט שחשוב לבחירה.",
  },
  {
    at: 0.55,
    title: "מרגישים את האירוע",
    text: "ככה נראה רגע לפני שהאורחים נכנסים.",
  },
  {
    at: 0.78,
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

export default function HomeHallScrollCinema() {
  const pinRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const rafRef = useRef<number | null>(null);

  const syncFromScroll = useEffectEvent(() => {
    const pin = pinRef.current;
    const video = videoRef.current;
    if (!pin) return;

    const rect = pin.getBoundingClientRect();
    const total = pin.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const raw = -rect.top / total;
    const p = Math.max(0, Math.min(1, raw));
    setProgress(p);

    if (!reduceMotion && video && video.duration && Number.isFinite(video.duration)) {
      const t = p * video.duration;
      if (Math.abs(video.currentTime - t) > 0.04) {
        try {
          video.currentTime = t;
        } catch {
          /* ignore seek race while loading */
        }
      }
    }

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

  return (
    <section
      ref={pinRef}
      className="home-hall-cinema"
      aria-label="סיור וידאו באולם — נע עם הגלילה"
      style={{ "--scroll-p": 0 } as CSSProperties}
    >
      <div className="home-hall-cinema__sticky">
        <div className="home-hall-cinema__stage">
          <div className="home-hall-cinema__frame">
            <video
              ref={videoRef}
              className="home-hall-cinema__video"
              src="/videos/hall-cinematic.mp4"
              muted
              playsInline
              preload="auto"
              aria-hidden
              onLoadedMetadata={() => {
                setReady(true);
                syncFromScroll();
              }}
            />
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
            {progress > 0.72 ? (
              <Link
                href="/halls"
                className="mt-6 inline-flex rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300"
              >
                חפש אולמות
              </Link>
            ) : (
              <p className="mt-6 text-xs text-white/55">
                {ready
                  ? "גללו למטה — הסרטון זז איתכם"
                  : "טוען את הסיור..."}
              </p>
            )}
          </div>

          <div
            className="home-hall-cinema__progress"
            aria-hidden
          >
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
