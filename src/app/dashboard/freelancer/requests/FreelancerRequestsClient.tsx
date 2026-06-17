"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import InquiryNegotiationHub from "@/components/inquiry-negotiation/InquiryNegotiationHub";
import ServiceRequestMessageBody from "@/components/service-requests/ServiceRequestMessageBody";
import { formatInquiryPreferredDateForDisplay } from "@/lib/inquiryMessageDisplay";
import {
  serviceRequestCancelledDetail,
  serviceRequestStatusLabel,
} from "@/lib/serviceRequestStatus";

type Req = {
  id: number;
  serviceId: number;
  inquiryId: number | null;
  negotiationThreadId: number | null;
  message: string;
  eventType: string | null;
  preferredDate: string | null;
  status: string;
  inquiryStatus?: string | null;
  providerNote: string | null;
  repliedAt: string | null;
  createdAt: string;
  user: { id: number; name: string | null; email: string; phone: string | null };
  service: { id: number; name: string };
};

const STATUS_FILTER = [
  { value: "", label: "הכל" },
  { value: "NEW", label: "חדשות" },
  { value: "READ", label: "נקראו" },
  { value: "REPLIED", label: "נענו" },
  { value: "CANCELLED", label: "בוטלו" },
];

export default function FreelancerRequestsClient() {
  const searchParams = useSearchParams();
  const urlInquiryId = Number(searchParams.get("inquiryId"));
  const urlThreadId = Number(searchParams.get("threadId"));

  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [repliedId, setRepliedId] = useState<number | null>(null);
  const [repliedNote, setRepliedNote] = useState("");
  const [negotiationInquiryId, setNegotiationInquiryId] = useState<number | null>(
    Number.isInteger(urlInquiryId) && urlInquiryId > 0 ? urlInquiryId : null
  );
  const [negotiationThreadId, setNegotiationThreadId] = useState<number | null>(
    Number.isInteger(urlThreadId) && urlThreadId > 0 ? urlThreadId : null
  );

  useEffect(() => {
    fetch("/api/freelancer/requests")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.requests)) setRequests(data.requests);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "" ? requests : requests.filter((r) => r.status === filter);

  async function markAs(
    id: number,
    status: "NEW" | "READ" | "REPLIED",
    providerNote?: string
  ) {
    const res = await fetch("/api/freelancer/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        providerNote: providerNote || undefined,
      }),
    });
    if (!res.ok) return;
    if (status === "REPLIED") {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "REPLIED",
                providerNote: providerNote || null,
                repliedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setRepliedId(null);
      setRepliedNote("");
    } else {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
  }

  async function declineRequest(id: number) {
    if (
      !window.confirm(
        "לבטל את השתתפותך באירוע? המזמין ובעל האולם יקבלו התראה."
      )
    ) {
      return;
    }
    const res = await fetch("/api/freelancer/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "decline" }),
    });
    if (!res.ok) return;
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
    );
  }

  function openNegotiation(r: Req) {
    if (!r.inquiryId) return;
    setNegotiationInquiryId(r.inquiryId);
    setNegotiationThreadId(r.negotiationThreadId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        טוען...
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 text-right text-sm">
      {negotiationInquiryId ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-950">הצעת מחיר חדשה עם המחפש</p>
            <button
              type="button"
              onClick={() => {
                setNegotiationInquiryId(null);
                setNegotiationThreadId(null);
              }}
              className="text-xs font-medium text-neutral-600 underline"
            >
              סגור
            </button>
          </div>
          <InquiryNegotiationHub
            inquiryId={negotiationInquiryId}
            initialThreadId={negotiationThreadId}
          />
        </div>
      ) : null}

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
          עדיין לא התקבלו בקשות. בקשות ממחפשי אולמות יופיעו כאן.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-600">סנן לפי סטטוס:</span>
            {STATUS_FILTER.map(({ value, label }) => (
              <button
                key={value || "all"}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === value
                    ? "bg-emerald-950 text-white shadow-sm"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:border-amber-400/60 hover:bg-neutral-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.map((r) => {
              const cancelled = r.status === "CANCELLED";
              const statusLabel = serviceRequestStatusLabel(
                r.status,
                r.inquiryStatus
              );
              const cancelledDetail = serviceRequestCancelledDetail(
                r.status,
                r.inquiryStatus
              );

              return (
              <article
                key={r.id}
                className={`rounded-2xl border p-4 shadow-[0_12px_40px_rgba(15,59,46,0.06)] ${
                  cancelled
                    ? "border-red-200/70 bg-red-50/40"
                    : r.status === "NEW"
                    ? "border-[#C9A227]/40 bg-[#FFF9E6]"
                    : r.status === "REPLIED"
                      ? "border-emerald-200/80 bg-emerald-50/90"
                      : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-semibold tracking-wide text-amber-800">
                        בקשה להצעת מחיר
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          cancelled
                            ? "bg-red-100 text-red-800"
                            : r.status === "NEW"
                              ? "bg-[#FFF9E6] text-emerald-950"
                              : r.status === "REPLIED"
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 font-semibold text-emerald-950">
                      {r.service.name}
                      <span className="mr-2 text-neutral-600">·</span>
                      <span className="text-neutral-800">{r.user.name || r.user.email}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                      <a
                        href={`mailto:${r.user.email}`}
                        className="text-emerald-950 underline decoration-[#C9A227]/50 hover:text-[#174D3B]"
                      >
                        {r.user.email}
                      </a>
                      {r.user.phone && (
                        <a
                          href={`tel:${r.user.phone}`}
                          className="text-emerald-950 underline decoration-[#C9A227]/50 hover:text-[#174D3B]"
                        >
                          {r.user.phone}
                        </a>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-600">
                      {new Date(r.createdAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!cancelled && r.inquiryId ? (
                      <button
                        type="button"
                        onClick={() => openNegotiation(r)}
                        className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                      >
                        הצעת מחיר חדשה
                      </button>
                    ) : null}
                    {!cancelled && (
                      <button
                        type="button"
                        onClick={() => declineRequest(r.id)}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100"
                      >
                        ביטול השתתפות
                      </button>
                    )}
                    {!cancelled && r.status === "NEW" && (
                      <>
                        <button
                          type="button"
                          onClick={() => markAs(r.id, "READ")}
                          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                        >
                          סמן כנקרא
                        </button>
                        <button
                          type="button"
                          onClick={() => setRepliedId(repliedId === r.id ? null : r.id)}
                          className="rounded-full bg-emerald-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-950"
                        >
                          סמן כנענה
                        </button>
                      </>
                    )}
                    {!cancelled && r.status === "READ" && (
                      <button
                        type="button"
                        onClick={() => setRepliedId(repliedId === r.id ? null : r.id)}
                        className="rounded-full bg-emerald-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-950"
                      >
                        סמן כנענה
                      </button>
                    )}
                  </div>
                </div>

                {cancelledDetail && (
                  <p className="mt-3 rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2 text-xs font-medium text-red-900">
                    {cancelledDetail}
                  </p>
                )}

                {(r.eventType || r.preferredDate) && (
                  <p className="mt-2 text-xs text-neutral-600">
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

                {repliedId === r.id && (
                  <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <label className="block text-xs text-neutral-600">
                      הערה (אופציונלי) – תישמר כסימון שנענית ללקוח
                    </label>
                    <textarea
                      rows={2}
                      value={repliedNote}
                      onChange={(e) => setRepliedNote(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
                      placeholder="למשל: יצרתי קשר, נקבע פגישה..."
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => markAs(r.id, "REPLIED", repliedNote)}
                        className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-300"
                      >
                        שמור וסמן כנענה
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRepliedId(null);
                          setRepliedNote("");
                        }}
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                )}

                {r.status === "REPLIED" && (r.providerNote || r.repliedAt) && (
                  <div className="mt-3 rounded-lg border border-emerald-200/80 bg-white/80 p-3 text-xs">
                    {r.providerNote && (
                      <p className="text-neutral-800">
                        <span className="font-medium text-emerald-800">הערה שלך: </span>
                        {r.providerNote}
                      </p>
                    )}
                    {r.repliedAt && (
                      <p className="mt-1 text-neutral-600">
                        סומן כנענה ב־{new Date(r.repliedAt).toLocaleString("he-IL")}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-sm text-neutral-600">אין בקשות בסטטוס זה.</p>
          )}
        </>
      )}
    </div>
  );
}
