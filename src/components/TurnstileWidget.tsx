"use client";

import { useEffect, useRef } from "react";
import { isTurnstileUnavailable } from "@/lib/turnstileClient";
import { USER_FACING_UNAVAILABLE } from "@/lib/userFacingErrors";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          retry?: "auto" | "never";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      remove: (id: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string) => void;
  onExpire?: () => void;
  /** העלאת ערך מרעננת את הווידג'ט אחרי כישלון שליחה */
  resetSignal?: number;
};

export default function TurnstileWidget({
  onToken,
  onExpire,
  resetSignal = 0,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  onTokenRef.current = onToken;
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!siteKey || !hostRef.current) return;
    let cancelled = false;
    const host = hostRef.current;

    const render = () => {
      if (cancelled || !window.turnstile) return;
      if (widgetId.current) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
        host.innerHTML = "";
      }
      widgetId.current = window.turnstile.render(host, {
        sitekey: siteKey,
        retry: "auto",
        appearance: "always",
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => {
          /* אל תפרקו את הווידג'ט — Cloudflare מציג שגיאה במקום */
        },
      });
    };

    const scriptSrc =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

    let script: HTMLScriptElement | null = null;
    if (window.turnstile) {
      render();
    } else {
      script = document.querySelector(
        `script[src="${scriptSrc}"]`
      ) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.src = scriptSrc;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, resetSignal]);

  if (isTurnstileUnavailable()) {
    return (
      <p className="mt-2 text-xs text-red-700" role="alert">
        {USER_FACING_UNAVAILABLE}
      </p>
    );
  }

  if (!siteKey) return null;
  return (
    <div
      ref={hostRef}
      className="mt-2 flex min-h-[65px] justify-end"
      aria-label="אימות אבטחה"
    />
  );
}
