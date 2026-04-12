"use client";

import { useCallback, useEffect, useRef } from "react";
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

  const hasVenue =
    venueLat != null &&
    venueLng != null &&
    venueLat >= 29 &&
    venueLat <= 34 &&
    venueLng >= 33 &&
    venueLng <= 36;

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

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (!parkingMarkerRef.current) {
        parkingMarkerRef.current = L.marker([lat, lng], {
          icon: parkingMarkerIcon,
          draggable: true,
        }).addTo(map);
        parkingMarkerRef.current.on("dragend", () => {
          const p = parkingMarkerRef.current?.getLatLng();
          if (p) onPickRef.current(p.lat, p.lng);
        });
      } else {
        parkingMarkerRef.current.setLatLng([lat, lng]);
      }
      onPickRef.current(lat, lng);
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
    if (!parkingMarkerRef.current) {
      parkingMarkerRef.current = L.marker([lat, lng], {
        icon: parkingMarkerIcon,
        draggable: true,
      }).addTo(map);
      parkingMarkerRef.current.on("dragend", () => {
        const p = parkingMarkerRef.current?.getLatLng();
        if (p) onPickRef.current(p.lat, p.lng);
      });
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
    } else if (parkingMarkerRef.current) {
      map.removeLayer(parkingMarkerRef.current);
      parkingMarkerRef.current = null;
    }
  }, [hasVenue, parkingLat, parkingLng, placeOrMoveParkingMarker]);

  if (!hasVenue) {
    return (
      <div className="rounded-xl border border-dashed border-[#D4C9BC] bg-[#FAF8F4] px-3 py-4 text-center text-[11px] text-[#6B6560]">
        קבעו קודם את מיקום האולם במפה למעלה — ואז תוכלו לסמן כאן את החניה (סיכה כתומה).
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-[#5C564C]">
        <span className="font-semibold text-[#0F3B2E]">סיכה כחולה</span> — האולם.{" "}
        <span className="font-semibold text-[#c2410c]">סיכה כתומה</span> — החניה. לחצו
        על המפה או גררו את הכתומה.
      </p>
      <div ref={containerRef} className="h-56 w-full overflow-hidden rounded-xl border border-[#E0D4C3]" />
      {onParkingClear && (parkingLat != null || parkingLng != null) && (
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (map && parkingMarkerRef.current) {
              map.removeLayer(parkingMarkerRef.current);
              parkingMarkerRef.current = null;
            }
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
