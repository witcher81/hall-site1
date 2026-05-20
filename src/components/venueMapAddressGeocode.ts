/**
 * גיאוקוד כתובת (עיר + רחוב) למפת בחירת מיקום — נפרד מלוגיקת הזום לפי עיר בלבד.
 * לא משנה את geocodeIsraelCity או את פונקציית העיר ב-VenueLocationPicker.
 */

import type { RefObject } from "react";
import type { Map as LeafletMap } from "leaflet";

type ApplyFn = (
  map: LeafletMap,
  data: { lat: number; lng: number; mode: "city" | "address" | null }
) => void;

const MIN_ADDRESS_LEN = 3;
/** מקסימום המתנה לשרת — בלי זה הטקסט "מחפש..." נשאר לנצח אם השרת איטי */
const ADDRESS_FETCH_MAX_MS = 48_000;

export async function fetchAddressOnMap(
  city: string,
  address: string,
  map: LeafletMap,
  addressAbortRef: RefObject<AbortController | null>,
  applyForwardResult: ApplyFn,
  setHint: (s: string) => void
): Promise<void> {
  const c = city.trim();
  const a = address.trim();
  if (!c || a.length < MIN_ADDRESS_LEN) return;

  addressAbortRef.current?.abort();
  const ac = new AbortController();
  addressAbortRef.current = ac;
  const timeoutId = window.setTimeout(() => ac.abort(), ADDRESS_FETCH_MAX_MS);

  setHint("מחפש מיקום לפי הכתובת...");
  try {
    const url = `/api/geocode/forward?city=${encodeURIComponent(c)}&address=${encodeURIComponent(a)}`;
    const res = await fetch(url, { cache: "no-store", signal: ac.signal });
    if (ac.signal.aborted) return;
    if (!res.ok) {
      setHint("שגיאה בחיפוש כתובת. נסו שוב.");
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
      const hasHouse = /\d{1,5}/.test(a);
      setHint(
        hasHouse
          ? "לא נמצא מספר בית מדויק לכתובת. בדקו רחוב+מספר (למשל «יוני נתניהו 30») או גררו את הסיכה במפה."
          : "לא נמצא מיקום מדויק לכתובת. הוסיפו מספר בית או בחרו נקודה במפה."
      );
      return;
    }

    applyForwardResult(map, {
      lat: data.lat,
      lng: data.lng,
      mode: "address",
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      if (addressAbortRef.current !== ac) return;
      setHint("החיפוש ארך יותר מדי. נסו שוב או בחרו נקודה במפה.");
      return;
    }
    setHint("שגיאה בחיפוש כתובת. נסו שוב או בחרו במפה.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}
