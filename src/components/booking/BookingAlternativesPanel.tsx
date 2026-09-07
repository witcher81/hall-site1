"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BookingAlternativeItem } from "@/lib/bookingAlternativesTypes";

export default function BookingAlternativesPanel({
  paymentId,
}: {
  paymentId: number;
}) {
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<BookingAlternativeItem[]>(
    []
  );

  useEffect(() => {
    fetch(`/api/booking-cancellations/${paymentId}/alternatives`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reason) setReason(data.reason);
        if (Array.isArray(data?.alternatives)) setAlternatives(data.alternatives);
      })
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (loading) return null;
  if (!reason) return null;

  return (
    <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/80 px-4 py-3 text-xs">
      <p className="font-semibold text-orange-950">ההזמנה בוטלה — הכסף יוחזר</p>
      <p className="mt-1 text-neutral-800">
        <span className="font-medium">סיבה: </span>
        {reason}
      </p>
      {alternatives.length > 0 ? (
        <div className="mt-3">
          <p className="font-medium text-emerald-950">
            אלטרנטיבות באותו מחיר:
          </p>
          <ul className="mt-2 space-y-2">
            {alternatives.map((alt) => (
              <li key={`${alt.type}-${alt.id}`}>
                <Link
                  href={alt.href}
                  className="block rounded-lg border border-emerald-200/80 bg-white px-3 py-2 transition hover:border-amber-400/60"
                >
                  <span className="font-semibold text-emerald-950">
                    {alt.name}
                  </span>
                  {alt.subtitle ? (
                    <span className="mr-2 text-neutral-600">· {alt.subtitle}</span>
                  ) : null}
                  <span className="mr-2 tabular-nums font-medium text-emerald-800">
                    ₪{alt.priceNis.toLocaleString("he-IL")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-neutral-600">
          לא נמצאו אלטרנטיבות באותו מחיר כרגע — אפשר לחפש אולמות/ספקים נוספים.
        </p>
      )}
    </div>
  );
}
