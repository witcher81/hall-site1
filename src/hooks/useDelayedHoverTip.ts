"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const CATEGORY_HOVER_DELAY_MS = 3000;

export type HoverTipState = {
  title: string;
  body: string;
  anchorRect: DOMRect;
};

export function useDelayedHoverTip(delayMs = CATEGORY_HOVER_DELAY_MS) {
  const [tip, setTip] = useState<HoverTipState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeKeyRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideTip = useCallback(() => {
    activeKeyRef.current = null;
    clearTimer();
    setTip(null);
  }, [clearTimer]);

  const showAfterDelay = useCallback(
    (key: string, title: string, body: string, el: HTMLElement) => {
      activeKeyRef.current = key;
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (activeKeyRef.current !== key) return;
        setTip({
          title,
          body,
          anchorRect: el.getBoundingClientRect(),
        });
      }, delayMs);
    },
    [clearTimer, delayMs]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return { tip, showAfterDelay, hideTip };
}
