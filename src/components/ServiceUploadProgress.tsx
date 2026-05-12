"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type UploadPhase =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

type Props = {
  phase: UploadPhase;
  /** אחוז העלאה בפועל (0–100); רלוונטי בעיקר במצב 'uploading' */
  uploadPercent: number;
  /** הודעת שגיאה להצגה במצב 'error' */
  errorMessage?: string | null;
  /** כותרת אופציונלית — ברירת מחדל מתאימה ליצירת שירות */
  title?: string;
  /** callback לסגירת ה-overlay במצב 'error' (אם לא יסופק, לא יהיה כפתור סגירה) */
  onDismissError?: () => void;
};

/**
 * Overlay מסך מלא עם פס התקדמות וטקסט שלב.
 * שימוש: השמע ב-state את phase + uploadPercent בזמן השליחה.
 *
 * אחוזים מוצגים אמיתיים בזמן ההעלאה (XHR upload progress).
 * לאחר 100% העלאה, פס ממשיך "להתנענע" (indeterminate) בזמן שהשרת מעבד.
 */
export default function ServiceUploadProgress({
  phase,
  uploadPercent,
  errorMessage,
  title = "שומרים את השירות",
  onDismissError,
}: Props) {
  // אנימציה עדינה של פס "indeterminate" בזמן עיבוד בשרת
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (phase !== "processing") return;
    let raf: number;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const elapsed = (t - start) / 1000;
      // ערך בין 0 ל-1 (משולש מתעורר וחוזר)
      const v = (Math.sin(elapsed * 1.6) + 1) / 2;
      setPulse(v);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  if (phase === "idle") return null;

  if (typeof document === "undefined") return null;

  const clamped = Math.max(0, Math.min(100, Math.round(uploadPercent)));

  const isError = phase === "error";
  const isSuccess = phase === "success";

  const headline = isError
    ? "אופס, משהו השתבש"
    : isSuccess
      ? "הושלם!"
      : title;

  const subline = isError
    ? errorMessage || "נסה שוב בעוד רגע."
    : phase === "uploading"
      ? clamped < 5
        ? "מתחילים להעלות..."
        : clamped < 95
          ? "מעלים תמונות..."
          : "סיום העלאה..."
      : phase === "processing"
        ? "השרת מעבד את השירות..."
        : "מעבירים אותך לעמוד השירות...";

  const barPercent = phase === "uploading" ? clamped : phase === "success" ? 100 : 60 + pulse * 35;

  const barColor = isError
    ? "bg-red-500"
    : isSuccess
      ? "bg-emerald-500"
      : "bg-[#C9A227]";

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F3B2E]/45 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right shadow-[0_24px_60px_rgba(15,59,46,0.25)]">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          HALLS HUB
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[#0F3B2E]">
          {headline}
        </h2>
        <p className="mt-2 text-sm text-[#5F5F5F]">{subline}</p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-[#6B6560]">
            <span>
              {phase === "uploading"
                ? `${clamped}%`
                : phase === "processing"
                  ? "מעבד..."
                  : isSuccess
                    ? "100%"
                    : ""}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#9A948C]">
              {phase === "uploading"
                ? "Step 1/2 · Upload"
                : phase === "processing"
                  ? "Step 2/2 · Processing"
                  : isSuccess
                    ? "Done"
                    : "Error"}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#EFE6D5]">
            <div
              className={`h-full ${barColor} transition-[width] duration-200 ease-out`}
              style={{
                width: `${Math.max(2, barPercent)}%`,
                opacity: phase === "processing" ? 0.85 : 1,
              }}
            />
          </div>
        </div>

        {(phase === "uploading" || phase === "processing") && (
          <p className="mt-4 text-[11px] text-[#9A948C]">
            אל תסגרו את הדף עד שתופיע ההודעה «הושלם».
          </p>
        )}

        {isError && onDismissError ? (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onDismissError}
              className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              סגור ונסה שוב
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
