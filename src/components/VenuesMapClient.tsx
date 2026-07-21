"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { defaultVenueMarkerIcon } from "@/lib/leafletVenueIcon";
import { createRoadTileLayer } from "@/lib/leafletRoadLayer";
import { googleStreetViewOpenUrl } from "@/lib/googleStreetViewUrl";
import { escapeHtml } from "@/lib/escapeHtml";

export type MapVenue = {
  id: number;
  name: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  /** true כשאין גיאוקוד — מיקום לפי מרכז העיר בלבד */
  approximate?: boolean;
};

export type MapFocusTarget = { lat: number; lng: number; zoom?: number };

function buildMarkerPopup(v: MapVenue): string {
  const addrLine = v.address
    ? `${escapeHtml(v.address)}, ${escapeHtml(v.city)}`
    : escapeHtml(v.city);
  const approx =
    v.approximate === true
      ? `<br/><span style="font-size:11px;color:#666">מיקום משוער (מרכז העיר) — עדכנו כתובת ושמרו כדי לדייק</span>`
      : "";
  const svUrl = escapeHtml(googleStreetViewOpenUrl(v.lat, v.lng));
  return `<div dir="rtl" style="text-align:right"><strong>${escapeHtml(v.name)}</strong><br/>${addrLine}${approx}<br/><a href="/halls/${v.id}">לעמוד האולם</a><br/><a href="${svUrl}" target="_blank" rel="noopener noreferrer">תצוגת רחוב (Google)</a></div>`;
}

export default function VenuesMapClient({
  venues,
  mapFocus,
  large = false,
}: {
  venues: MapVenue[];
  /** כשאין סיכות מתאימות — מרכזים על עיר (מרכז משוער) */
  mapFocus?: MapFocusTarget | null;
  /** מפה גבוהה יותר בחלון מודאלי */
  large?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const venuesRef = useRef(venues);
  venuesRef.current = venues;

  const focusLat = mapFocus?.lat ?? null;
  const focusLng = mapFocus?.lng ?? null;
  const focusZoom = mapFocus?.zoom ?? null;

  /** מציג רק סיכות בתוך האזור הנצפה (+שוליים) — חוסך עומס בזום קרוב */
  function syncVisibleMarkers(map: L.Map) {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const bounds = map.getBounds().pad(0.12);
    const zoom = map.getZoom();
    // בזום רחוק (כל ישראל) — מגבילים כמות סיכות כדי לא להאט
    const maxAtWideZoom = zoom <= 8 ? 120 : zoom <= 10 ? 250 : 2000;
    let added = 0;

    for (const v of venuesRef.current) {
      if (!bounds.contains([v.lat, v.lng])) continue;
      if (added >= maxAtWideZoom) break;
      const m = L.marker([v.lat, v.lng], { icon: defaultVenueMarkerIcon });
      m.bindPopup(buildMarkerPopup(v));
      layer.addLayer(m);
      added += 1;
    }
  }

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
    }).setView([31.5, 34.85], 7);
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

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    const onViewChange = () => syncVisibleMarkers(map);
    map.on("moveend", onViewChange);
    map.on("zoomend", onViewChange);

    const fixSize = () => map.invalidateSize();
    const t = window.setTimeout(fixSize, 80);
    const ro =
      typeof ResizeObserver !== "undefined" && containerRef.current
        ? new ResizeObserver(() => fixSize())
        : null;
    ro?.observe(containerRef.current);

    return () => {
      window.clearTimeout(t);
      ro?.disconnect();
      map.off("moveend", onViewChange);
      map.off("zoomend", onViewChange);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (venues.length > 0 && focusLat != null && focusLng != null) {
      const pts = venues.map((v) => L.latLng(v.lat, v.lng));
      const fg = L.latLngBounds(pts);
      map.fitBounds(fg.pad(0.08), {
        maxZoom: focusZoom != null && focusZoom > 0 ? focusZoom : undefined,
      });
      if (focusZoom != null && focusZoom > 0 && map.getZoom() < focusZoom) {
        map.setZoom(focusZoom);
      }
    } else if (venues.length > 0) {
      map.setView([31.5, 34.85], 7);
    } else if (
      focusLat != null &&
      focusLng != null &&
      Number.isFinite(focusLat) &&
      Number.isFinite(focusLng)
    ) {
      map.setView(
        [focusLat, focusLng],
        focusZoom != null && focusZoom > 0 ? focusZoom : 12
      );
    } else {
      map.setView([31.5, 34.85], 7);
    }

    const israelBounds = L.latLngBounds(L.latLng(29.5, 34.25), L.latLng(33.3, 35.85));
    map.panInsideBounds(israelBounds, { animate: false });
    syncVisibleMarkers(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncVisibleMarkers stable via refs
  }, [venues, focusLat, focusLng, focusZoom]);

  const mapHeightClass = large
    ? "min-h-[min(48vh,420px)] flex-1 w-full rounded-2xl bg-neutral-50 sm:min-h-[min(58vh,640px)]"
    : "h-[min(70vh,560px)] w-full rounded-2xl bg-neutral-50";

  return (
    <div className={large ? "flex min-h-0 flex-1 flex-col gap-2" : "space-y-2"}>
      <div ref={containerRef} className={mapHeightClass} />
      {large ? (
        <p className="shrink-0 text-[11px] leading-relaxed text-neutral-500">
          לחיצה על סיכה: עמוד האולם ותצוגת רחוב. מפה: OpenStreetMap · לוויין: ArcGIS.
          הסיכות מתעדכנות לפי האזור שרואים במסך.
        </p>
      ) : (
        <>
          <p className="text-[11px] leading-relaxed text-neutral-600">
            מפה רגילה: OpenStreetMap; לוויין: תצלום. הגלילה מוגבלת לישראל. בלחיצה על סיכה: &quot;תצוגת רחוב
            (Google)&quot; בלשונית חדשה. הסיכות מוצגות לפי האזור הנצפה.
          </p>
          <p className="text-[11px] leading-relaxed text-neutral-600">
            השמות על גבי המפה הם חלק מאריחי התמונה (OSM) — לא ניתן לשנות אוטומטית עברית מול ערבית לפי סוג
            יישוב; זה דורש מפת וקטור ושפה ייעודית (מפתח/ספק).
          </p>
        </>
      )}
    </div>
  );
}
