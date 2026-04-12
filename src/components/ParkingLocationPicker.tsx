"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { defaultVenueMarkerIcon } from "@/lib/leafletVenueIcon";
import { parkingMarkerIcon } from "@/lib/leafletParkingIcon";
import { createRoadTileLayer } from "@/lib/leafletRoadLayer";

type Props = {
  venueLat: number | null;
  venueLng: number | null;
  parkingLat: number | null;
  parkingLng: number | null;
  onParkingPick: (lat: number, lng: number) => void;
  onParkingClear?: () => void;
};

function syncMapLayout(map: L.Map) {
  map.invalidateSize({ animate: false });
  requestAnimationFrame(() => map.invalidateSize({ animate: false }));
}

/** אייקון כפתור — מיניאטורה של סיכה כתומה (כמו במפה) */
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

export default function ParkingLocationPicker({
  venueLat,
  venueLng,
  parkingLat,
  parkingLng,
  onParkingPick,
  onParkingClear,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const venueMarkerRef = useRef<L.Marker | null>(null);
  const parkingMarkerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onParkingPick);
  onPickRef.current = onParkingPick;
  const placingRef = useRef(false);
  const [placingParking, setPlacingParking] = useState(false);

  useEffect(() => {
    placingRef.current = placingParking;
  }, [placingParking]);

  const hasVenue =
    venueLat != null &&
    venueLng != null &&
    venueLat >= 29 &&
    venueLat <= 34 &&
    venueLng >= 33 &&
    venueLng <= 36;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.cursor = placingParking && hasVenue ? "crosshair" : "";
  }, [placingParking, hasVenue]);

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
    createRoadTileLayer().addTo(map);
    map.panInsideBounds(israelBounds, { animate: false });

    const ro =
      typeof ResizeObserver !== "undefined" && containerRef.current
        ? new ResizeObserver(() => syncMapLayout(map))
        : null;
    ro?.observe(containerRef.current);

    const attachDragEnd = (marker: L.Marker) => {
      marker.off("dragend");
      marker.on("dragend", () => {
        const p = parkingMarkerRef.current?.getLatLng();
        if (p) onPickRef.current(p.lat, p.lng);
      });
    };

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!placingRef.current) return;
      const { lat, lng } = e.latlng;
      if (!parkingMarkerRef.current) {
        parkingMarkerRef.current = L.marker([lat, lng], {
          icon: parkingMarkerIcon,
          draggable: true,
        }).addTo(map);
        attachDragEnd(parkingMarkerRef.current);
      } else {
        parkingMarkerRef.current.setLatLng([lat, lng]);
      }
      onPickRef.current(lat, lng);
      setPlacingParking(false);
    });

    map.whenReady(() => {
      syncMapLayout(map);
      window.setTimeout(() => syncMapLayout(map), 80);
    });

    return () => {
      ro?.disconnect();
      map.remove();
      mapRef.current = null;
      venueMarkerRef.current = null;
      parkingMarkerRef.current = null;
    };
  }, []);

  const placeOrMoveVenueMarker = useCallback((map: L.Map, lat: number, lng: number) => {
    if (!venueMarkerRef.current) {
      venueMarkerRef.current = L.marker([lat, lng], {
        icon: defaultVenueMarkerIcon,
      }).addTo(map);
    } else {
      venueMarkerRef.current.setLatLng([lat, lng]);
    }
  }, []);

  const placeOrMoveParkingMarker = useCallback((map: L.Map, lat: number, lng: number) => {
    const attachDragEnd = (marker: L.Marker) => {
      marker.off("dragend");
      marker.on("dragend", () => {
        const p = parkingMarkerRef.current?.getLatLng();
        if (p) onPickRef.current(p.lat, p.lng);
      });
    };
    if (!parkingMarkerRef.current) {
      parkingMarkerRef.current = L.marker([lat, lng], {
        icon: parkingMarkerIcon,
        draggable: true,
      }).addTo(map);
      attachDragEnd(parkingMarkerRef.current);
    } else {
      parkingMarkerRef.current.setLatLng([lat, lng]);
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasVenue) return;
    placeOrMoveVenueMarker(map, venueLat!, venueLng!);
    map.flyTo([venueLat!, venueLng!], 16, { duration: 0.5 });
    syncMapLayout(map);
  }, [hasVenue, venueLat, venueLng, placeOrMoveVenueMarker]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasVenue) return;
    if (
      parkingLat != null &&
      parkingLng != null &&
      parkingLat >= 29 &&
      parkingLat <= 34 &&
      parkingLng >= 33 &&
      parkingLng <= 36
    ) {
      placeOrMoveParkingMarker(map, parkingLat, parkingLng);
      const m = parkingMarkerRef.current;
      if (m) {
        m.off("dragend");
        m.on("dragend", () => {
          const p = parkingMarkerRef.current?.getLatLng();
          if (p) onPickRef.current(p.lat, p.lng);
        });
      }
    } else if (parkingMarkerRef.current) {
      map.removeLayer(parkingMarkerRef.current);
      parkingMarkerRef.current = null;
    }
  }, [hasVenue, parkingLat, parkingLng, placeOrMoveParkingMarker]);

  const hasParkingPin =
    parkingLat != null &&
    parkingLng != null &&
    parkingLat >= 29 &&
    parkingLat <= 34 &&
    parkingLng >= 33 &&
    parkingLng <= 36;

  if (!hasVenue) {
    return (
      <div className="rounded-xl border border-dashed border-[#D4C9BC] bg-[#FAF8F4] px-3 py-4 text-center text-[11px] text-[#6B6560]">
        קבעו קודם את מיקום האולם במפה למעלה — ואז תוכלו לסמן כאן את החניה בסיכה הכתומה.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-[#5C564C]">
        <span className="font-semibold text-[#0F3B2E]">סיכה כחולה</span> — האולם.{" "}
        <span className="font-semibold text-[#c2410c]">סיכה כתומה</span> — החניה.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPlacingParking((p) => !p)}
          className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition ${
            placingParking
              ? "border-[#ea580c] bg-[#fff7ed] text-[#9a3412] ring-2 ring-[#ea580c]/30"
              : "border-[#fdba74] bg-white text-[#9a3412] hover:bg-[#fff7ed]"
          }`}
        >
          <OrangePinGlyph className="shrink-0" />
          {placingParking
            ? "לחצו עכשיו על המפה במקום החניה (או בטלו)"
            : hasParkingPin
              ? "הזזת סיכת חניה — לחץ כאן ואז על המפה"
              : "שים סיכת חניה כתומה — לחץ כאן ואז על המפה"}
        </button>
        {placingParking && (
          <button
            type="button"
            onClick={() => setPlacingParking(false)}
            className="rounded-lg border border-[#D4C9BC] px-2 py-1.5 text-[11px] text-[#6B6560] hover:bg-[#FAF8F4]"
          >
            ביטול
          </button>
        )}
      </div>

      {placingParking && (
        <p className="text-[11px] font-medium text-[#c2410c]">
          מצב סימון פעיל: לחיצה אחת על המפה תניח או תזיז את הסיכה הכתומה.
        </p>
      )}

      {!placingParking && !hasParkingPin && (
        <p className="text-[11px] text-[#6B6560]">
          אחרי לחיצה על הכפתור הכתום, לחצו על המפה בדיוק איפה החניה (אפשר אחר כך לגרור את
          הסיכה).
        </p>
      )}

      <div ref={containerRef} className="h-56 w-full overflow-hidden rounded-xl border border-[#E0D4C3]" />

      {onParkingClear && hasParkingPin && (
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (map && parkingMarkerRef.current) {
              map.removeLayer(parkingMarkerRef.current);
              parkingMarkerRef.current = null;
            }
            setPlacingParking(false);
            onParkingClear();
          }}
          className="text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
        >
          נקה סימון חניה
        </button>
      )}
    </div>
  );
}
