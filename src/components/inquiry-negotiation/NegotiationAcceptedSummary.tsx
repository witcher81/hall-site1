"use client";

import { useEffect, useState } from "react";
import { formatOfferAmount } from "@/lib/negotiationFormat";
import type { NegotiationHubView } from "@/lib/negotiationTypes";

export default function NegotiationAcceptedSummary({
  inquiryId,
}: {
  inquiryId: number;
}) {
  const [hub, setHub] = useState<NegotiationHubView | null>(null);

  useEffect(() => {
    fetch(`/api/inquiries/${inquiryId}/negotiation`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.hub) setHub(data.hub);
      })
      .catch(() => {});
  }, [inquiryId]);

  const accepted = hub?.threads.filter(
    (t) => t.status === "DEAL_ACCEPTED" && t.acceptedOffer
  );
  if (!accepted?.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-emerald-300 bg-gradient-to-l from-emerald-50 to-amber-50/40 px-4 py-3">
      <p className="text-xs font-semibold text-emerald-950">הצעות שאושרו בהתמקחות</p>
      <ul className="mt-2 space-y-1 text-xs text-neutral-800">
        {accepted.map((t) => (
          <li key={t.id}>
            <strong>{t.label}</strong>
            {t.acceptedOffer
              ? ` — ${formatOfferAmount(
                  t.acceptedOffer.amountMinNis,
                  t.acceptedOffer.amountMaxNis
                )}`
              : ""}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-neutral-600">
        לאישור סופי של התאריך באולם — המשיכו למטה בהתמקחות או המתינו לאישור בעל האולם.
      </p>
    </div>
  );
}
