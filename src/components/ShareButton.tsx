"use client";

import { useState } from "react";

type Props = {
  url?: string;
  sharePath?: string;
  title: string;
  className?: string;
};

export default function ShareButton({ url, sharePath, title, className = "" }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleShare() {
    setFeedback(null);
    const fullUrl =
      url ??
      (typeof window !== "undefined" && sharePath
        ? `${window.location.origin}${sharePath}`
        : typeof window !== "undefined"
          ? window.location.href
          : "");
    if (!fullUrl) return;
    const shareData = { title, url: fullUrl };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    try {
      await navigator.clipboard.writeText(fullUrl);
      setFeedback("הקישור הועתק");
      window.setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback("לא ניתן לשתף — העתיקו מהשורת כתובת");
      window.setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <span className={`inline-flex flex-col items-end gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => void handleShare()}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-950 transition hover:border-amber-400 hover:bg-amber-50"
        aria-label="שיתוף"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        שיתוף
      </button>
      {feedback ? (
        <span className="text-[10px] text-emerald-800">{feedback}</span>
      ) : null}
    </span>
  );
}
