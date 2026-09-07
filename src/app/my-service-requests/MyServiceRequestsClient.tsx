"use client";

import { useEffect, useState } from "react";
import ServiceRequestMessageBody from "@/components/service-requests/ServiceRequestMessageBody";
import { formatInquiryPreferredDateForDisplay } from "@/lib/inquiryMessageDisplay";
import Link from "next/link";
import {
  canSeekerPayServiceRequest,
  serviceRequestStatusLabel,
} from "@/lib/serviceRequestStatus";
import { serviceRequestCheckoutHref } from "@/lib/checkoutDisplay";

type Req = {
  id: number;
  message: string;
  eventType: string | null;
  preferredDate: string | null;
  status: string;
  providerNote: string | null;
  repliedAt: string | null;
  createdAt: string;
  service: {
    id: number;
    name: string;
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    providerId: number;
    provider: { id: number; name: string | null; businessName: string | null };
  };
};

export default function MyServiceRequestsClient({
  bookingPaymentsEnabled = false,
}: {
  bookingPaymentsEnabled?: boolean;
}) {
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-service-requests")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.requests)) setRequests(data.requests);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        טוען...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        עדיין לא שלחת בקשות לספקים.{" "}
        <a href="/providers" className="font-semibold text-emerald-950 hover:underline">
          חפש ספקים
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 text-right text-sm">
      {requests.map((r) => {
        const providerName =
          r.service.provider.businessName || r.service.provider.name || "ספק";
        return (
          <article
            key={r.id}
            className={`rounded-2xl border p-4 shadow-[0_12px_40px_rgba(15,59,46,0.06)] ${
              r.status === "NEW"
                ? "border-[#C9A227]/40 bg-[#FFF9E6]"
                : r.status === "REPLIED"
                  ? "border-emerald-200/80 bg-emerald-50/90"
                  : "border-neutral-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-emerald-950">
                {r.service.name}
                <span className="mr-2 text-neutral-600">·</span>
                <span className="text-neutral-800">{providerName}</span>
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r.status === "PAID"
                    ? "bg-emerald-600 text-white"
                    : r.status === "CANCELLED_BY_PROVIDER"
                      ? "bg-orange-100 text-orange-900"
                      : r.status === "NEW"
                        ? "bg-[#FFF9E6] text-emerald-950"
                        : r.status === "REPLIED"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-neutral-50 text-neutral-600"
                }`}
              >
                {serviceRequestStatusLabel(r.status)}
              </span>
            </div>
            {(r.eventType || r.preferredDate) && (
              <p className="mt-1 text-xs text-neutral-600">
                {r.eventType && <span>סוג אירוע: {r.eventType}</span>}
                {r.preferredDate && (
                  <span className="mr-3">
                    תאריך:{" "}
                    {formatInquiryPreferredDateForDisplay(r.preferredDate) ||
                      r.preferredDate}
                  </span>
                )}
              </p>
            )}
            <ServiceRequestMessageBody message={r.message} />
            {r.status === "REPLIED" && (r.providerNote || r.repliedAt) && (
              <div className="mt-3 rounded-lg border border-emerald-200/80 bg-white/90 p-3 text-xs">
                {r.providerNote && (
                  <p className="text-neutral-800">
                    <span className="font-medium text-emerald-800">תשובת הספק: </span>
                    {r.providerNote}
                  </p>
                )}
                {r.repliedAt && (
                  <p className="mt-1 text-neutral-600">
                    נענה ב־{new Date(r.repliedAt).toLocaleString("he-IL")}
                  </p>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-neutral-600">
              נשלח ב־{new Date(r.createdAt).toLocaleDateString("he-IL")}
            </p>
            {bookingPaymentsEnabled && canSeekerPayServiceRequest(r.status) && (
              <Link
                href={serviceRequestCheckoutHref(r.id)}
                className="mt-3 inline-flex rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-neutral-950 shadow-sm transition hover:bg-amber-300"
              >
                לתשלום מאובטח
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}
