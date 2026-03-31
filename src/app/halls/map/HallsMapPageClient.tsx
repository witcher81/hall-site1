"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MapVenue } from "@/components/VenuesMapClient";

const VenuesMapClient = dynamic(
  () => import("@/components/VenuesMapClient"),
  {
    ssr: false,
    loading: () => (
      <p className="py-12 text-center text-sm text-[#5F5F5F]">טוען מפה...</p>
    ),
  }
);

export default function HallsMapPageClient() {
  const [venues, setVenues] = useState<MapVenue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/venues/map")
      .then((r) => r.json())
      .then((data) => {
        setVenues(data.venues ?? []);
      })
      .catch(() => setError("טעינת אולמות למפה נכשלה"));
  }, []);

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }
  if (!venues) {
    return <p className="py-12 text-center text-sm text-[#5F5F5F]">טוען נתונים...</p>;
  }
  if (venues.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#5F5F5F]">
        אין אולמות להצגה על המפה עדיין.
      </p>
    );
  }

  return <VenuesMapClient venues={venues} />;
}
