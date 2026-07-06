"use client";

import type { HoverTipState } from "@/hooks/useDelayedHoverTip";
import { createPortal } from "react-dom";

type Props = {
  tip: HoverTipState | null;
};

/** בועת הסבר צפה — מוצגת אחרי השהיית עכבר */
export default function CategoryHoverTooltip({ tip }: Props) {
  if (!tip || typeof document === "undefined") return null;

  const { anchorRect, title, body } = tip;
  const centerX = anchorRect.left + anchorRect.width / 2;
  const top = Math.max(12, anchorRect.top - 8);

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[800] max-w-[min(20rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-right shadow-lg"
      style={{ left: centerX, top }}
    >
      <p className="text-[11px] font-semibold text-emerald-950">{title}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-neutral-600">{body}</p>
      <p className="mt-1.5 text-[9px] text-neutral-400">הסבר — השארו את העכבר על הפריט</p>
    </div>,
    document.body
  );
}
