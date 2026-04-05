"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  HH_REALTIME_EVENT,
  type RealtimePayload,
} from "@/lib/realtimeEvents";

let unreadFetchInFlight: Promise<number> | null = null;

async function fetchUnreadTotal(): Promise<number> {
  if (unreadFetchInFlight) return unreadFetchInFlight;
  unreadFetchInFlight = (async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return 0;
      const data = (await res.json().catch(() => null)) as {
        unreadCount?: unknown;
      };
      return typeof data?.unreadCount === "number" ? data.unreadCount : 0;
    } catch {
      return 0;
    } finally {
      unreadFetchInFlight = null;
    }
  })();
  return unreadFetchInFlight;
}

export default function NotificationsUnreadBadge() {
  const pathname = usePathname();
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    const n = await fetchUnreadTotal();
    setTotalUnread(n);
  }, []);

  useEffect(() => {
    void fetchUnread();
  }, [fetchUnread]);

  useEffect(() => {
    function onRealtime(e: Event) {
      const d = (e as CustomEvent<RealtimePayload>).detail;
      if (
        d?.type === "badges" &&
        typeof d.notifications === "number"
      ) {
        setTotalUnread(d.notifications);
      }
    }
    window.addEventListener(HH_REALTIME_EVENT, onRealtime as EventListener);
    return () =>
      window.removeEventListener(HH_REALTIME_EVENT, onRealtime as EventListener);
  }, []);

  useEffect(() => {
    function onFocus() {
      void fetchUnread();
    }
    function onVisibility() {
      if (document.visibilityState === "visible") void fetchUnread();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchUnread]);

  useEffect(() => {
    if (pathname.startsWith("/notifications")) void fetchUnread();
  }, [pathname, fetchUnread]);

  if (totalUnread <= 0) return null;

  return (
    <span
      className="absolute -top-0.5 -end-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#0F3B2E]"
      aria-hidden
      title={`${totalUnread} התראות שלא נקראו`}
    />
  );
}

