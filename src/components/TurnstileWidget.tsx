"use client";

import { useEffect, useRef } from "react";

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
        }
      ) => string;
      remove: (id: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string) => void;
  onExpire?: () => void;
};

export default function TurnstileWidget({ onToken, onExpire }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    if (!siteKey || !ref.current) return;

    const render = () => {
      if (!ref.current || !window.turnstile) return;
      if (widgetId.current) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": () => onExpire?.(),
        "error-callback": () => onExpire?.(),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector('script[src*="turnstile"]');
      if (!existing) {
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.onload = render;
        document.head.appendChild(s);
      } else {
        existing.addEventListener("load", render);
        render();
      }
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [siteKey, onToken, onExpire]);

  if (!siteKey) return null;
  return <div ref={ref} className="mt-2 flex justify-end" />;
}
