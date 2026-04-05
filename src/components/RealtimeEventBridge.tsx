"use client";

import { useEffect } from "react";
import { HH_REALTIME_EVENT, type RealtimePayload } from "@/lib/realtimeEvents";

/**
 * חיבור יחיד ל־Server-Sent Events — מחליף polling בבאדג'ים.
 * נסגר אוטומטית אחרי ~8s בצד השרת; הלקוח מתחבר מחדש.
 */
export default function RealtimeEventBridge() {
  useEffect(() => {
    let es: EventSource | null = null;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (stopped) return;
      es = new EventSource("/api/realtime/stream");
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data) as RealtimePayload;
          if (
            payload?.type === "badges" &&
            typeof payload.notifications === "number" &&
            typeof payload.messages === "number"
          ) {
            window.dispatchEvent(
              new CustomEvent(HH_REALTIME_EVENT, { detail: payload })
            );
          }
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        if (!stopped) {
          reconnectTimer = setTimeout(connect, 1_200);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, []);

  return null;
}
