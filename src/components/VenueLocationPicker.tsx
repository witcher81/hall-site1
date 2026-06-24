"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  venueHallPickerMarkerIcon,
  venueParkingPickerMarkerIcon,
} from "@/lib/leafletVenuePickerIcons";
import { createRoadTileLayer } from "@/lib/leafletRoadLayer";
import {
  googleMapsExplorerUrl,
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
  /** עריכה: חניה שמורה מהשרת */
  initialParking?: { lat: number; lng: number } | null;
  /** עריכה: לא לגרור סיכות אוטומטית לפי עיר/כתובת — רק ידנית או גרירה */
  preferSavedMapPins?: boolean;
  /** מעלה nonce — מרכז מפה לפי כתובת (עריכה, בכפתור בלבד) */
  syncMapFromAddressNonce?: number;
  /** קואורדינטות מדויקות מהצעת כתובת / בחירה ברשימה */
  pinVenueAt?: { lat: number; lng: number; nonce: number } | null;
  /** בעריכה — גיאוקוד לפי כתובת לא מוחק סיכת חניה שמורה */
  clearParkingOnAddressGeocode?: boolean;
  /** לחיצה על המפה למיקום אולם מוחקת סיכת חניה */
  clearParkingWhenHallMoves?: boolean;
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

/** Leaflet leaves _leaflet_id on the DOM — must clear before re-init (React strict / remount). */
function resetLeafletContainer(el: HTMLElement) {
  const node = el as HTMLElement & { _leaflet_id?: number };
  if (node._leaflet_id != null) {
    delete node._leaflet_id;
  }
  el.replaceChildren();
}

const HALL_MARKER_TOOLTIP = "מיקום האולם — סיכה כחולה עם האות «א»";
const PARKING_MARKER_TOOLTIP = "מיקום חניה — סיכה כתומה עם האות «ח»";

/** Leaflet + עמוד RTL: המפה חייבת ltr כדי שה-tooltip יישב מעל הסיכה ולא מוזז לצד. */
const markerTooltipOpts: L.TooltipOptions = {
  direction: "top",
  offset: L.point(0, -12),
  className: "venue-picker-marker-tooltip",
};

function addHallMarkerToMap(map: L.Map, lat: number, lng: number, draggable = false) {
  return L.marker([lat, lng], { icon: venueHallPickerMarkerIcon, draggable })
    .bindTooltip(HALL_MARKER_TOOLTIP, markerTooltipOpts)
    .addTo(map);
}

function addParkingMarkerToMap(map: L.Map, lat: number, lng: number) {
  return L.marker([lat, lng], {
    icon: venueParkingPickerMarkerIcon,
    draggable: true,
  })
    .bindTooltip(PARKING_MARKER_TOOLTIP, markerTooltipOpts)
    .addTo(map);
}

export default function VenueLocationPicker({
  onPick,
  onClear,
  formCity = "",
  formAddress = "",
  formFieldsSyncNonce = 0,
  parkingOnSameMap = null,
  initialVenue = null,
  initialParking = null,
  preferSavedMapPins = false,
  syncMapFromAddressNonce = 0,
  pinVenueAt = null,
  clearParkingOnAddressGeocode = true,
  clearParkingWhenHallMoves = true,
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
  const initialParkingRef = useRef(initialParking);
  initialParkingRef.current = initialParking;
  const preferSavedMapPinsRef = useRef(preferSavedMapPins);
  preferSavedMapPinsRef.current = preferSavedMapPins;
  const clearParkingOnAddressGeocodeRef = useRef(clearParkingOnAddressGeocode);
  clearParkingOnAddressGeocodeRef.current = clearParkingOnAddressGeocode;
  const clearParkingWhenHallMovesRef = useRef(clearParkingWhenHallMoves);
  clearParkingWhenHallMovesRef.current = clearParkingWhenHallMoves;
  /** עריכה: לא לגרור סיכה לפי עיר/כתובת עד blur מפורש (formFieldsSyncNonce) */
  const debouncedFormGeocodeEnabledRef = useRef(
    !preferSavedMapPins && initialVenue == null
  );
  const savedPinsRestoredRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [mapInitError, setMapInitError] = useState<string | null>(null);
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

  const notifyHallPick = useCallback((lat: number, lng: number) => {
    onPickRef.current({
      lat,
      lng,
      city: formCityRef.current.trim() || null,
      address: formAddressRef.current.trim() || null,
    });
    setPicked({ lat, lng });
  }, []);

  const attachHallDragEnd = useCallback(
    (marker: L.Marker) => {
      marker.off("dragend");
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        notifyHallPick(p.lat, p.lng);
        suppressFormGeocodeUntilRef.current = Date.now() + SUPPRESS_FORM_GEOCODE_MS;
        setHint("מיקום האולם עודכן. אפשר לגרור שוב לדיוק.");
      });
    },
    [notifyHallPick]
  );

  const placeHallPinAt = useCallback(
    (map: L.Map, lat: number, lng: number, hintText: string) => {
      const draggable = preferSavedMapPinsRef.current;
      if (!markerRef.current) {
        markerRef.current = addHallMarkerToMap(map, lat, lng, draggable);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
      if (draggable && markerRef.current) attachHallDragEnd(markerRef.current);
      notifyHallPick(lat, lng);
      suppressFormGeocodeUntilRef.current = Date.now() + SUPPRESS_FORM_GEOCODE_MS;
      map.flyTo([lat, lng], 19, { duration: 0.75 });
      syncMapAfterFly(map);
      setHint(hintText);
    },
    [attachHallDragEnd, notifyHallPick]
  );

  const clearParkingBecauseVenueMoved = useCallback(() => {
    if (!clearParkingWhenHallMovesRef.current) return;
    removeParkingMarkerLayer();
    parkingOnSameMapRef.current?.onClear();
  }, [removeParkingMarkerLayer]);

  const restoreSavedPinsOnMap = useCallback(
    (map: L.Map) => {
      const iv = initialVenueRef.current;
      if (iv && isValidIsraelLatLng(iv.lat, iv.lng)) {
        placeHallPinAt(
          map,
          iv.lat,
          iv.lng,
          preferSavedMapPinsRef.current
            ? "מיקומי האולם והחניה מהנתונים השמורים. גררו את הסיכות לדיוק."
            : "מיקום האולם מהנתונים השמורים. אפשר לשנות בלחיצה על המפה."
        );
      }

      const ip = initialParkingRef.current;
      const parkCfg = parkingOnSameMapRef.current;
      if (
        parkCfg?.active &&
        ip &&
        isValidIsraelLatLng(ip.lat, ip.lng)
      ) {
        if (!parkingMarkerRef.current) {
          parkingMarkerRef.current = addParkingMarkerToMap(map, ip.lat, ip.lng);
        } else {
          parkingMarkerRef.current.setLatLng([ip.lat, ip.lng]);
        }
        attachParkingDragEnd(parkingMarkerRef.current);
        parkCfg.onPick(ip.lat, ip.lng);
      }

      if (iv) {
        savedPinsRestoredRef.current = true;
      }
    },
    [attachHallDragEnd, attachParkingDragEnd, placeHallPinAt]
  );

  useEffect(() => {
    if (!pinVenueAt) return;
    const map = mapRef.current;
    if (!map || !isValidIsraelLatLng(pinVenueAt.lat, pinVenueAt.lng)) return;
    placeHallPinAt(
      map,
      pinVenueAt.lat,
      pinVenueAt.lng,
      "מיקום לפי הכתובת שנבחרה. אפשר לגרור את הסיכה לדיוק נוסף."
    );
  }, [pinVenueAt?.lat, pinVenueAt?.lng, pinVenueAt?.nonce, placeHallPinAt]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const israelBounds = L.latLngBounds(
      L.latLng(29.5, 34.25),
      L.latLng(33.3, 35.85)
    );
    let map: L.Map;
    try {
      resetLeafletContainer(container);
      map = L.map(container, {
        attributionControl: false,
        maxBounds: israelBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 7,
        maxZoom: 19,
        worldCopyJump: false,
      }).setView([31.5, 34.85], 8);
      mapRef.current = map;
      setMapInitError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "שגיאה בטעינת המפה";
      setMapInitError(msg);
      setHint("לא הצלחנו לטעון את המפה. נסו לרענן את הדף.");
      return;
    }

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
        if (preferSavedMapPinsRef.current || initialVenueRef.current) {
          restoreSavedPinsOnMap(map);
          return;
        }
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
          setHint(
            "קבעו קודם את מיקום האולם (סיכה כחולה עם «א») לפני סימון החניה."
          );
          return;
        }
        const { lat, lng } = e.latlng;
        if (!parkingMarkerRef.current) {
          parkingMarkerRef.current = addParkingMarkerToMap(map, lat, lng);
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
        markerRef.current = addHallMarkerToMap(map, lat, lng);
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
  }, [attachParkingDragEnd, clearParkingBecauseVenueMoved, restoreSavedPinsOnMap]);

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
        if (clearParkingOnAddressGeocodeRef.current) {
          removeParkingMarkerLayer();
          parkingOnSameMapRef.current?.onClear();
        }
        const hallDraggable = preferSavedMapPinsRef.current;
        if (!markerRef.current) {
          markerRef.current = addHallMarkerToMap(map, lat, lng, hallDraggable);
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (hallDraggable && markerRef.current) attachHallDragEnd(markerRef.current);
        setPicked({ lat, lng });
        syncMapLayout(map);
        map.flyTo([lat, lng], 19, { duration: 0.75 });
        syncMapAfterFly(map);
        onPickRef.current({
          lat,
          lng,
          city: formCityRef.current.trim() || null,
          address: formAddressRef.current.trim() || null,
        });
        setHint(
          "הסימון לפי הכתובת והמספר שהזנת. אפשר לגרור את הסיכה הכחולה לדיוק נוסף."
        );
      }
    },
    [attachHallDragEnd, removeMarkerOnly, removeParkingMarkerLayer]
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
      const citySnap = city.trim();
      const addressSnap = address.trim();
      await fetchAddressOnMap(
        citySnap,
        addressSnap,
        map,
        addressForwardAbortRef,
        applyForwardResult,
        setHint,
        () =>
          formCityRef.current.trim() === citySnap &&
          formAddressRef.current.trim() === addressSnap
      );
    },
    [applyForwardResult]
  );

  runForwardRef.current = runForwardGeocode;

  useEffect(() => {
    if (formFieldsSyncNonce <= 0) return;
    if (preferSavedMapPinsRef.current) return;
    debouncedFormGeocodeEnabledRef.current = true;
    const c = formCity.trim();
    const a = formAddress.trim();
    if (a.length >= 3) {
      void runAddressForwardGeocode(c, a);
    } else {
      void runForwardGeocode(c);
    }
  }, [formFieldsSyncNonce, formCity, formAddress, runForwardGeocode, runAddressForwardGeocode]);

  useEffect(() => {
    if (syncMapFromAddressNonce <= 0) return;
    debouncedFormGeocodeEnabledRef.current = true;
    const c = formCity.trim();
    const a = formAddress.trim();
    if (a.length >= 3) {
      void runAddressForwardGeocode(c, a);
    } else if (c) {
      void runForwardGeocode(c);
    }
  }, [
    syncMapFromAddressNonce,
    formCity,
    formAddress,
    runForwardGeocode,
    runAddressForwardGeocode,
  ]);

  useEffect(() => {
    if (!debouncedFormGeocodeEnabledRef.current) return;
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

  /** עריכה: גיאוקוד כתובת רק אחרי שינוי ידני (לא בטעינה) */
  const addressGeocodeSnapshotRef = useRef<{ city: string; address: string } | null>(
    null
  );
  useEffect(() => {
    if (!preferSavedMapPinsRef.current) return;
    const c = formCity.trim();
    const a = formAddress.trim();
    if (!c || a.length < 3) return;
    if (!addressGeocodeSnapshotRef.current) {
      addressGeocodeSnapshotRef.current = { city: c, address: a };
      return;
    }
    const snap = addressGeocodeSnapshotRef.current;
    if (c === snap.city && a === snap.address) return;
    const t = window.setTimeout(() => {
      if (Date.now() < suppressFormGeocodeUntilRef.current) return;
      void runAddressForwardGeocode(c, a);
    }, ADDRESS_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [formCity, formAddress, runAddressForwardGeocode]);

  /** מיקום אולם שמור (עריכה) — גיבוי אם המפה נטענה לפני whenReady */
  useEffect(() => {
    const iv = initialVenueRef.current;
    if (!iv || !isValidIsraelLatLng(iv.lat, iv.lng)) return;
    if (savedPinsRestoredRef.current) return;
    const t = window.setTimeout(() => {
      const map = mapRef.current;
      if (!map) return;
      restoreSavedPinsOnMap(map);
    }, 180);
    return () => window.clearTimeout(t);
  }, [
    initialVenue?.lat,
    initialVenue?.lng,
    initialParking?.lat,
    initialParking?.lng,
    restoreSavedPinsOnMap,
  ]);

  /** סנכרון סיכת חניה מההורה */
  useEffect(() => {
    const map = mapRef.current;
    const cfg = parkingOnSameMap;
    if (!map || !cfg?.active) {
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
        parkingMarkerRef.current = addParkingMarkerToMap(map, lat, lng);
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
    <div className="venue-location-picker space-y-2">
      <div
        ref={containerRef}
        dir="ltr"
        className="venue-location-picker-map h-64 w-full rounded-2xl bg-neutral-50"
      />
      <p className="text-[11px] text-neutral-600">
        {mapInitError
          ? mapInitError
          : loading
            ? "טוען..."
            : hint}
      </p>

      {parkingOnSameMap != null && (
        <div className="space-y-2 rounded-xl border border-[#E8D5C4] bg-[#FFFBF7] px-3 py-2">
          <p className="text-[11px] leading-relaxed text-[#5C564C]">
            <span className="font-semibold text-[#1d4ed8]">כחול + «א»</span> — מיקום האולם.{" "}
            <span className="font-semibold text-[#c2410c]">כתום + «ח»</span> — חניה (כשבוחרים סוג
            שדורש סימון במפה).
          </p>
          {!picked ? (
            <p className="text-[11px] text-neutral-600">
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
                    ? "יש לבחור סוג חניה שדורש סימון במפה (למשל «בקרבת מקום»)"
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
                    className="rounded-lg border border-[#D4C9BC] px-2 py-1.5 text-[11px] text-neutral-600 hover:bg-white"
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
                          href={googleMapsExplorerUrl(pLat, pLng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-emerald-950 underline underline-offset-2 hover:opacity-90"
                        >
                          פתח את מיקום החניה ב-Google Maps (מפת סייר)
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
                          className="text-[11px] text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
          <a
            href={googleMapsExplorerUrl(picked.lat, picked.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-950 underline underline-offset-2 hover:opacity-90"
          >
            פתח את מיקום האולם ב-Google Maps (מפת סייר)
          </a>
          <a
            href={googleStreetViewOpenUrl(picked.lat, picked.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-950 underline underline-offset-2 hover:opacity-90"
          >
            תצוגת רחוב ב-Google (חיצים וניווט)
          </a>
          <button
            type="button"
            onClick={clearPin}
            className="rounded-lg border border-[#C9A227]/60 bg-white px-2 py-1 text-neutral-600 hover:bg-neutral-50"
          >
            הסר סיכה
          </button>
        </div>
      )}
    </div>
  );
}
