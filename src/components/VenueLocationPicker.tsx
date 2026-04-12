"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { defaultVenueMarkerIcon } from "@/lib/leafletVenueIcon";
import { parkingMarkerIcon } from "@/lib/leafletParkingIcon";
import { createRoadTileLayer } from "@/lib/leafletRoadLayer";
import {
  googleMapsOpenPinUrl,
  googleStreetViewOpenUrl,
} from "@/lib/googleStreetViewUrl";
import { tryExactCityCoords } from "@/lib/israel-city-coords";
import { fetchAddressOnMap } from "@/components/venueMapAddressGeocode";

export type ParkingOnSameMapConfig = {
  active: boolean;
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  onClear: () => void;
};

type Props = {
  onPick: (payload: {
    lat: number;
    lng: number;
    city: string | null;
    address: string | null;
  }) => void;
  onClear?: () => void;
  formCity?: string;
  formAddress?: string;
  formFieldsSyncNonce?: number;
  /** חניה — אותה מפה (סיכה כתומה) */
  parkingOnSameMap?: ParkingOnSameMapConfig | null;
  /** עריכת אולם: מיקום שמור מהשרת */
  initialVenue?: { lat: number; lng: number } | null;
};

const CITY_DEBOUNCE_MS = 220;
const ADDRESS_DEBOUNCE_MS = 450;
const SUPPRESS_FORM_GEOCODE_MS = 2500;

function syncMapLayout(map: L.Map) {
  map.invalidateSize({ animate: false });
  requestAnimationFrame(() => {
    map.invalidateSize({ animate: false });
  });
}

function syncMapAfterFly(map: L.Map) {
  const bump = () => {
    syncMapLayout(map);
    requestAnimationFrame(() => {
      syncMapLayout(map);
      window.setTimeout(() => syncMapLayout(map), 200);
    });
  };
  map.once("moveend", bump);
}

function OrangePinGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="28"
      viewBox="0 0 32 42"
      aria-hidden
    >
      <path
        fill="#ea580c"
        stroke="#fff"
        strokeWidth="2"
        d="M16 1C8.3 1 2 7.1 2 14.5c0 10.2 14 26.5 14 26.5S30 24.7 30 14.5C30 7.1 23.7 1 16 1z"
      />
      <circle cx="16" cy="14" r="5" fill="#fff" />
    </svg>
  );
}

function isValidIsraelLatLng(lat: number, lng: number) {
  return lat >= 29 && lat <= 34 && lng >= 33 && lng <= 36;
}

export default function VenueLocationPicker({
  onPick,
  onClear,
  formCity = "",
  formAddress = "",
  formFieldsSyncNonce = 0,
  parkingOnSameMap = null,
  initialVenue = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const parkingMarkerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const onClearRef = useRef(onClear);
  const suppressFormGeocodeUntilRef = useRef(0);
  const forwardAbortRef = useRef<AbortController | null>(null);
  const addressForwardAbortRef = useRef<AbortController | null>(null);
  const formCityRef = useRef(formCity);
  const formAddressRef = useRef(formAddress);
  const runForwardRef = useRef<(c: string) => Promise<void>>(async () => {});
  const parkingOnSameMapRef = useRef<ParkingOnSameMapConfig | null>(null);
  parkingOnSameMapRef.current = parkingOnSameMap ?? null;
  const initialVenueRef = useRef(initialVenue);
  initialVenueRef.current = initialVenue;

  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState(
    "לחץ על המפה או מלא עיר וכתובת — המפה תתעדכן. אפשר לגרור את הסיכה למיקום המדויק."
  );
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [placingParking, setPlacingParking] = useState(false);
  const placingParkingRef = useRef(false);

  useEffect(() => {
    placingParkingRef.current = placingParking;
  }, [placingParking]);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  formCityRef.current = formCity;
  formAddressRef.current = formAddress;

  const removeParkingMarkerLayer = useCallback(() => {
    const map = mapRef.current;
    const pm = parkingMarkerRef.current;
    if (map && pm) {
      map.removeLayer(pm);
      parkingMarkerRef.current = null;
    }
  }, []);

  const removeMarkerOnly = useCallback(() => {
    removeParkingMarkerLayer();
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      map.removeLayer(marker);
      markerRef.current = null;
    }
    setPicked(null);
  }, [removeParkingMarkerLayer]);

  const clearPin = useCallback(() => {
    removeMarkerOnly();
    setPlacingParking(false);
    setHint(
      "לחץ על המפה או מלא עיר וכתובת — המפה תתעדכן. אפשר לגרור את הסיכה למיקום המדויק."
    );
    onClearRef.current?.();
  }, [removeMarkerOnly]);

  const attachParkingDragEnd = useCallback((marker: L.Marker) => {
    marker.off("dragend");
    marker.on("dragend", () => {
      const p = parkingMarkerRef.current?.getLatLng();
      const cfg = parkingOnSameMapRef.current;
      if (p && cfg?.active) cfg.onPick(p.lat, p.lng);
    });
  }, []);

  const clearParkingBecauseVenueMoved = useCallback(() => {
    removeParkingMarkerLayer();
    parkingOnSameMapRef.current?.onClear();
  }, [removeParkingMarkerLayer]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const israelBounds = L.latLngBounds(L.latLng(29.5, 34.25), L.latLng(33.3, 35.85));
    const map = L.map(containerRef.current, {
      attributionControl: false,
      maxBounds: israelBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 7,
      maxZoom: 19,
      worldCopyJump: false,
    }).setView([31.5, 34.85], 8);
    mapRef.current = map;

    const roadLayer = createRoadTileLayer();
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, noWrap: true }
    );
    roadLayer.addTo(map);
    L.control
      .layers(
        {
          "מפה רגילה": roadLayer,
          לוויין: satelliteLayer,
        },
        undefined,
        { collapsed: false, position: "topright" }
      )
      .addTo(map);
    map.panInsideBounds(israelBounds, { animate: false });

    let forwardAfterReadyTimer: number | undefined;
    map.whenReady(() => {
      syncMapLayout(map);
      forwardAfterReadyTimer = window.setTimeout(() => {
        forwardAfterReadyTimer = undefined;
        syncMapLayout(map);
        const c = formCityRef.current.trim();
        if (c && mapRef.current) void runForwardRef.current(c);
      }, 60);
    });

    let resizeObs: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObs = new ResizeObserver(() => {
        syncMapLayout(map);
      });
      resizeObs.observe(containerRef.current);
    }

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const parkCfg = parkingOnSameMapRef.current;
      if (placingParkingRef.current && parkCfg?.active) {
        if (!markerRef.current) {
          setHint("קבעו קודם את מיקום האולם (סיכה כחולה) לפני סימון החניה.");
          return;
        }
        const { lat, lng } = e.latlng;
        if (!parkingMarkerRef.current) {
          parkingMarkerRef.current = L.marker([lat, lng], {
            icon: parkingMarkerIcon,
            draggable: true,
          }).addTo(map);
          attachParkingDragEnd(parkingMarkerRef.current);
        } else {
          parkingMarkerRef.current.setLatLng([lat, lng]);
        }
        parkCfg.onPick(lat, lng);
        setPlacingParking(false);
        return;
      }

      const { lat, lng } = e.latlng;
      clearParkingBecauseVenueMoved();

      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng], { icon: defaultVenueMarkerIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      setLoading(true);
      setHint("מאתר עיר וכתובת לפי המיקום שבחרת...");
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
          cache: "no-store",
        });
        const data = (await res.json().catch(() => null)) as {
          city?: string | null;
          address?: string | null;
        } | null;
        onPickRef.current({
          lat,
          lng,
          city: typeof data?.city === "string" ? data.city : null,
          address: typeof data?.address === "string" ? data.address : null,
        });
        setPicked({ lat, lng });
        setHint("המיקום נבחר. אפשר ללחוץ שוב לשינוי או לעדכן עיר/כתובת בטופס.");
      } catch {
        onPickRef.current({ lat, lng, city: null, address: null });
        setPicked({ lat, lng });
        setHint("המיקום נשמר, אבל לא הצלחנו לזהות כתובת אוטומטית.");
      } finally {
        suppressFormGeocodeUntilRef.current = Date.now() + SUPPRESS_FORM_GEOCODE_MS;
        setLoading(false);
      }
    });

    return () => {
      if (forwardAfterReadyTimer != null) window.clearTimeout(forwardAfterReadyTimer);
      forwardAbortRef.current?.abort();
      addressForwardAbortRef.current?.abort();
      resizeObs?.disconnect();
      map.remove();
      markerRef.current = null;
      parkingMarkerRef.current = null;
      mapRef.current = null;
    };
  }, [attachParkingDragEnd, clearParkingBecauseVenueMoved]);

  const applyForwardResult = useCallback(
    (
      map: L.Map,
      data: {
        lat: number;
        lng: number;
        mode: "city" | "address" | null;
      }
    ) => {
      if (data.mode === "city") {
        syncMapLayout(map);
        removeMarkerOnly();
        onClearRef.current?.();
        map.flyTo([data.lat, data.lng], 12, { duration: 0.7 });
        syncMapAfterFly(map);
        setHint("המפה ממורכזת לפי העיר. הוסיפו כתובת לסימון מדויק.");
        return;
      }

      if (data.mode === "address") {
        const { lat, lng } = data;
        removeParkingMarkerLayer();
        parkingOnSameMapRef.current?.onClear();
        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng], { icon: defaultVenueMarkerIcon }).addTo(map);
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }
        setPicked({ lat, lng });
        syncMapLayout(map);
        map.flyTo([lat, lng], 18, { duration: 0.75 });
        syncMapAfterFly(map);
        onPickRef.current({
          lat,
          lng,
          city: formCityRef.current.trim() || null,
          address: formAddressRef.current.trim() || null,
        });
        setHint("הסימון לפי הכתובת שהזנת. אפשר לגרור במפה אם צריך לדייק.");
      }
    },
    [removeMarkerOnly, removeParkingMarkerLayer]
  );

  const runForwardGeocode = useCallback(
    async (city: string) => {
      const map = mapRef.current;
      if (!map) return;
      const c = city.trim();
      if (!c) return;

      addressForwardAbortRef.current?.abort();
      forwardAbortRef.current?.abort();
      const ac = new AbortController();
      forwardAbortRef.current = ac;

      setHint("מחפש מיקום לפי העיר...");
      try {
        const url = `/api/geocode/forward?city=${encodeURIComponent(c)}&address=`;
        const res = await fetch(url, { cache: "no-store", signal: ac.signal });
        if (ac.signal.aborted) return;
        if (!res.ok) {
          const local = tryExactCityCoords(c);
          if (local && !ac.signal.aborted) {
            applyForwardResult(map, { lat: local.lat, lng: local.lng, mode: "city" });
            setHint("המפה ממורכזת לפי העיר (מרשימה מקומית). הוסיפו כתובת לסימון מדויק.");
            return;
          }
          setHint("שגיאה בחיפוש מיקום. נסו שוב.");
          return;
        }
        const data = (await res.json()) as {
          lat: number | null;
          lng: number | null;
          mode: "city" | "address" | null;
          found?: boolean;
        };
        if (ac.signal.aborted) return;

        if (!data.found || data.lat == null || data.lng == null) {
          const local = tryExactCityCoords(c);
          if (local && !ac.signal.aborted) {
            applyForwardResult(map, { lat: local.lat, lng: local.lng, mode: "city" });
            setHint("המפה ממורכזת לפי העיר (מרשימה מקומית). הוסיפו כתובת לסימון מדויק.");
            return;
          }
          setHint("לא נמצאה העיר. בדקו איות או בחרו במפה.");
          return;
        }

        applyForwardResult(map, {
          lat: data.lat,
          lng: data.lng,
          mode: "city",
        });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        const local = tryExactCityCoords(c);
        const mapNow = mapRef.current;
        if (local && mapNow) {
          applyForwardResult(mapNow, { lat: local.lat, lng: local.lng, mode: "city" });
          setHint("המפה ממורכזת לפי העיר (מרשימה מקומית). הוסיפו כתובת לסימון מדויק.");
          return;
        }
        setHint("שגיאה בחיפוש מיקום. נסו שוב או בחרו במפה.");
      }
    },
    [applyForwardResult]
  );

  const runAddressForwardGeocode = useCallback(
    async (city: string, address: string) => {
      const map = mapRef.current;
      if (!map) return;
      forwardAbortRef.current?.abort();
      await fetchAddressOnMap(
        city,
        address,
        map,
        addressForwardAbortRef,
        applyForwardResult,
        setHint
      );
    },
    [applyForwardResult]
  );

  runForwardRef.current = runForwardGeocode;

  useEffect(() => {
    if (formFieldsSyncNonce <= 0) return;
    const c = formCity.trim();
    const a = formAddress.trim();
    if (a.length >= 3) {
      void runAddressForwardGeocode(c, a);
    } else {
      void runForwardGeocode(c);
    }
  }, [formFieldsSyncNonce, formCity, formAddress, runForwardGeocode, runAddressForwardGeocode]);

  useEffect(() => {
    const c = formCity.trim();
    const a = formAddress.trim();
    if (!c) return;
    const delay = a.length >= 3 ? ADDRESS_DEBOUNCE_MS : CITY_DEBOUNCE_MS;
    const t = window.setTimeout(() => {
      if (Date.now() < suppressFormGeocodeUntilRef.current) return;
      if (a.length >= 3) {
        void runAddressForwardGeocode(c, a);
      } else {
        void runForwardGeocode(c);
      }
    }, delay);
    return () => window.clearTimeout(t);
  }, [formCity, formAddress, runForwardGeocode, runAddressForwardGeocode]);

  /** מיקום אולם שמור (עריכה) */
  useEffect(() => {
    const iv = initialVenueRef.current;
    if (!iv || !isValidIsraelLatLng(iv.lat, iv.lng)) return;
    const t = window.setTimeout(() => {
      const map = mapRef.current;
      if (!map || markerRef.current) return;
      const { lat, lng } = iv;
      markerRef.current = L.marker([lat, lng], { icon: defaultVenueMarkerIcon }).addTo(map);
      setPicked({ lat, lng });
      map.flyTo([lat, lng], 16);
      syncMapAfterFly(map);
      onPickRef.current({
        lat,
        lng,
        city: formCityRef.current.trim() || null,
        address: formAddressRef.current.trim() || null,
      });
      setHint("מיקום האולם מהנתונים השמורים. אפשר לשנות בלחיצה על המפה.");
    }, 140);
    return () => window.clearTimeout(t);
  }, [initialVenue?.lat, initialVenue?.lng]);

  /** סנכרון סיכת חניה מההורה */
  useEffect(() => {
    const map = mapRef.current;
    const cfg = parkingOnSameMap;
    if (!map || !cfg?.active || !markerRef.current) {
      if (!cfg?.active) {
        setPlacingParking(false);
        removeParkingMarkerLayer();
      }
      return;
    }
    const { lat, lng } = cfg;
    if (
      lat != null &&
      lng != null &&
      isValidIsraelLatLng(lat, lng)
    ) {
      if (!parkingMarkerRef.current) {
        parkingMarkerRef.current = L.marker([lat, lng], {
          icon: parkingMarkerIcon,
          draggable: true,
        }).addTo(map);
      } else {
        parkingMarkerRef.current.setLatLng([lat, lng]);
      }
      attachParkingDragEnd(parkingMarkerRef.current);
    } else if (parkingMarkerRef.current) {
      map.removeLayer(parkingMarkerRef.current);
      parkingMarkerRef.current = null;
    }
  }, [
    parkingOnSameMap?.active,
    parkingOnSameMap?.lat,
    parkingOnSameMap?.lng,
    picked,
    removeParkingMarkerLayer,
    attachParkingDragEnd,
  ]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cross =
      placingParking && parkingOnSameMap?.active && picked != null;
    el.style.cursor = cross ? "crosshair" : "";
  }, [placingParking, parkingOnSameMap?.active, picked]);

  const hasParkingPin =
    parkingOnSameMap != null &&
    parkingOnSameMap.active &&
    parkingOnSameMap.lat != null &&
    parkingOnSameMap.lng != null &&
    isValidIsraelLatLng(parkingOnSameMap.lat, parkingOnSameMap.lng);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-64 w-full rounded-2xl bg-[#FAF8F4]"
      />
      <p className="text-[11px] text-[#6B6560]">{loading ? "טוען..." : hint}</p>

      {parkingOnSameMap != null && (
        <div className="space-y-2 rounded-xl border border-[#E8D5C4] bg-[#FFFBF7] px-3 py-2">
          <p className="text-[11px] leading-relaxed text-[#5C564C]">
            <span className="font-semibold text-[#0F3B2E]">כחול</span> — האולם.{" "}
            <span className="font-semibold text-[#c2410c]">כתום</span> — חניה (רק כשיש חניה).
          </p>
          {!picked ? (
            <p className="text-[11px] text-[#6B6560]">
              קבעו קודם את מיקום האולם על המפה, ואז אפשר לסמן חניה.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlacingParking((p) => !p)}
                  disabled={!parkingOnSameMap.active}
                  className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    placingParking
                      ? "border-[#ea580c] bg-[#fff7ed] text-[#9a3412] ring-2 ring-[#ea580c]/30"
                      : "border-[#fdba74] bg-white text-[#9a3412] hover:bg-[#fff7ed]"
                  }`}
                >
                  <OrangePinGlyph className="shrink-0" />
                  {!parkingOnSameMap.active
                    ? "יש לבחור באפשרות «יש חניה» ברדיו"
                    : placingParking
                      ? "לחצו על המפה במקום החניה (או בטלו)"
                      : hasParkingPin
                        ? "הזזת חניה — לחץ כאן ואז על המפה"
                        : "שים סיכת חניה כתומה — לחץ כאן ואז על המפה"}
                </button>
                {placingParking && (
                  <button
                    type="button"
                    onClick={() => setPlacingParking(false)}
                    className="rounded-lg border border-[#D4C9BC] px-2 py-1.5 text-[11px] text-[#6B6560] hover:bg-white"
                  >
                    ביטול
                  </button>
                )}
              </div>
              {placingParking && parkingOnSameMap.active && (
                <p className="text-[11px] font-medium text-[#c2410c]">
                  מצב סימון: לחיצה אחת על המפה מניחה או מזיזה את הסיכה הכתומה.
                </p>
              )}
              {parkingOnSameMap.active && hasParkingPin
                ? (() => {
                    const pLat = parkingOnSameMap.lat;
                    const pLng = parkingOnSameMap.lng;
                    if (pLat == null || pLng == null) return null;
                    return (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <a
                          href={googleMapsOpenPinUrl(pLat, pLng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-[#0F3B2E] underline underline-offset-2 hover:opacity-90"
                        >
                          פתח את נקודת החניה ב-Google Maps
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const map = mapRef.current;
                            if (map && parkingMarkerRef.current) {
                              map.removeLayer(parkingMarkerRef.current);
                              parkingMarkerRef.current = null;
                            }
                            setPlacingParking(false);
                            parkingOnSameMap.onClear();
                          }}
                          className="text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
                        >
                          נקה סימון חניה
                        </button>
                      </div>
                    );
                  })()
                : null}
            </>
          )}
        </div>
      )}

      {picked && (
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <a
            href={googleStreetViewOpenUrl(picked.lat, picked.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0F3B2E] underline underline-offset-2 hover:opacity-90"
          >
            תצוגת רחוב ב-Google (חיצים וניווט)
          </a>
          <button
            type="button"
            onClick={clearPin}
            className="rounded-lg border border-[#C9A227]/60 bg-white px-2 py-1 text-[#5F5F5F] hover:bg-[#FAF8F4]"
          >
            הסר סיכה
          </button>
        </div>
      )}
    </div>
  );
}
