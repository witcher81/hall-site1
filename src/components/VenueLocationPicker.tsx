"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { defaultVenueMarkerIcon } from "@/lib/leafletVenueIcon";
import { createRoadTileLayer } from "@/lib/leafletRoadLayer";
import { googleStreetViewOpenUrl } from "@/lib/googleStreetViewUrl";
import { tryExactCityCoords } from "@/lib/israel-city-coords";
import { fetchAddressOnMap } from "@/components/venueMapAddressGeocode";

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
};

const CITY_DEBOUNCE_MS = 220;
/** כתובת: debounce ארוך יותר כדי לא להציף את ה-API בזמן הקלדה — לא משנה את runForwardGeocode */
const ADDRESS_DEBOUNCE_MS = 450;
const SUPPRESS_FORM_GEOCODE_MS = 2500;

function syncMapLayout(map: L.Map) {
  map.invalidateSize({ animate: false });
  requestAnimationFrame(() => {
    map.invalidateSize({ animate: false });
  });
}

/** אחרי flyTo — אריחים בחלק העליון של המיכל לפעמים נשארים אפורים עד invalidateSize */
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

export default function VenueLocationPicker({
  onPick,
  onClear,
  formCity = "",
  formAddress = "",
  formFieldsSyncNonce = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const onClearRef = useRef(onClear);
  const suppressFormGeocodeUntilRef = useRef(0);
  const forwardAbortRef = useRef<AbortController | null>(null);
  /** נפרד מ-forwardAbortRef — גיאוקוד כתובת לא מבטל את העיר אלא אם מתחילים כתובת/עיר מחדש בכוונה */
  const addressForwardAbortRef = useRef<AbortController | null>(null);
  const formCityRef = useRef(formCity);
  const formAddressRef = useRef(formAddress);
  const runForwardRef = useRef<(c: string) => Promise<void>>(async () => {});

  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState(
    "לחץ על המפה או מלא עיר וכתובת — המפה תתעדכן. אפשר לגרור את הסיכה למיקום המדויק."
  );
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  formCityRef.current = formCity;
  formAddressRef.current = formAddress;

  const removeMarkerOnly = useCallback(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      map.removeLayer(marker);
      markerRef.current = null;
    }
    setPicked(null);
  }, []);

  const clearPin = useCallback(() => {
    removeMarkerOnly();
    setHint(
      "לחץ על המפה או מלא עיר וכתובת — המפה תתעדכן. אפשר לגרור את הסיכה למיקום המדויק."
    );
    onClearRef.current?.();
  }, [removeMarkerOnly]);

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
      /** אחרי layout + invalidateSize — Leaflet לפעמים עדיין 0×0 ב-microtask הראשון */
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
      const { lat, lng } = e.latlng;
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
      mapRef.current = null;
    };
  }, []);

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
    [removeMarkerOnly]
  );

  /**
   * זום לפי עיר בלבד — לא שולחים כתובת חלקית ל-API (זה כשל ומונע זום).
   * גיבוי מקומי אם הרשת/נומינטים נכשלים.
   */
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

  /** גיאוקוד כתובת — קובץ נפרד; מבטל רק בקשת עיר פתוחה כדי שלא ידרסו זום כתובת */
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

  /** blur — עיר תמיד; כתובת רק אם יש מספיק תווים */
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

  /** הקלדה: עיר בלבד או כתובת — runForwardGeocode נשאר ללא שינוי */
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

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-64 w-full rounded-2xl bg-[#FAF8F4]"
      />
      <p className="text-[11px] text-[#6B6560]">{loading ? "טוען..." : hint}</p>
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
