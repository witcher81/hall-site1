"use client";

import { useEffect, useRef } from "react";
import { ENGAGED_VIEW_MIN_MS } from "@/lib/popularityConfig";

function sessionKeyVenue(venueId: number) {
  return `hall_engaged_view_${venueId}`;
}

function sessionKeyProvider(providerUserId: number) {
  return `hall_engaged_provider_${providerUserId}`;
}

function runEngagedTimer(
  sessionKey: string,
  onEngaged: (dwellMs: number) => void
): () => void {
  let done = false;
  try {
    if (sessionStorage.getItem(sessionKey)) {
      done = true;
    }
  } catch {
    /* private mode */
  }
  if (done) return () => {};

  let accumulated = 0;
  let lastTick = Date.now();

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      lastTick = Date.now();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  const tick = () => {
    if (done) return;
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    accumulated += Math.min(now - lastTick, 2000);
    lastTick = now;
    if (accumulated >= ENGAGED_VIEW_MIN_MS) {
      done = true;
      try {
        sessionStorage.setItem(sessionKey, "1");
      } catch {
        /* ignore */
      }
      onEngaged(Math.round(accumulated));
    }
  };

  const id = window.setInterval(tick, 400);
  return () => {
    done = true;
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

export function useEngagedVenueView(venueId: number) {
  const venueIdRef = useRef(venueId);
  venueIdRef.current = venueId;

  useEffect(() => {
    return runEngagedTimer(sessionKeyVenue(venueIdRef.current), (dwellMs) => {
      void fetch("/api/analytics/venue-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: venueIdRef.current,
          dwellMs,
        }),
      }).catch(() => {});
    });
  }, [venueId]);
}

export function useEngagedFreelancerProfileView(providerUserId: number) {
  const idRef = useRef(providerUserId);
  idRef.current = providerUserId;

  useEffect(() => {
    return runEngagedTimer(sessionKeyProvider(idRef.current), (dwellMs) => {
      void fetch("/api/analytics/freelancer-profile-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerUserId: idRef.current,
          dwellMs,
        }),
      }).catch(() => {});
    });
  }, [providerUserId]);
}
