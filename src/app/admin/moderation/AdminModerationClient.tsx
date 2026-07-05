"use client";

import { useEffect, useState } from "react";
import ListingModerationBadge from "@/components/ListingModerationBadge";

type ModerationItem = {
  listingType: "VENUE" | "SERVICE";
  listingTypeLabel: string;
  id: number;
  name: string;
  subtitle: string | null;
  moderationStatus: string;
  moderationNote: string | null;
  submittedForReviewAt: string;
  contentRevision: number;
  coverImageUrl: string | null;
  owner: {
    id: number;
    email: string;
    name: string | null;
    businessName: string | null;
  };
  publicHref: string;
  editHref: string;
};

type QueueData = {
  venues: ModerationItem[];
  services: ModerationItem[];
  pendingCounts: { venues: number; services: number; total: number };
};

export default function AdminModerationClient() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/moderation?status=${encodeURIComponent(status)}`);
    const json = await res.json().catch(() => null);
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [status]);

  async function decide(
    item: ModerationItem,
    decision: "APPROVED" | "REJECTED"
  ) {
    const key = `${item.listingType}-${item.id}`;
    if (decision === "REJECTED" && !rejectNote[key]?.trim()) {
      alert("נא לציין סיבת דחייה");
      return;
    }
    setBusyKey(key);
    await fetch("/api/admin/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingType: item.listingType,
        listingId: item.id,
        decision,
        note: decision === "REJECTED" ? rejectNote[key]?.trim() : null,
      }),
    });
    setBusyKey(null);
    void load();
  }

  const items = [...(data?.venues ?? []), ...(data?.services ?? [])].sort(
    (a, b) =>
      new Date(b.submittedForReviewAt).getTime() -
      new Date(a.submittedForReviewAt).getTime()
  );

  return (
    <div className="space-y-4 text-right text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-neutral-700">
          אולמות ושירותים חדשים/מעודכנים ממתינים לאישור לפני פרסום באתר.
        </p>
        {data?.pendingCounts ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950">
            {data.pendingCounts.total} ממתינים (
            {data.pendingCounts.venues} אולמות, {data.pendingCounts.services} שירותים)
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "PENDING", label: "ממתינים" },
          { id: "APPROVED", label: "מאושרים" },
          { id: "REJECTED", label: "נדחו" },
          { id: "ALL", label: "הכל" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatus(tab.id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              status === tab.id
                ? "border-emerald-950 bg-emerald-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-neutral-600">טוען...</p> : null}

      {!loading && items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-white p-6 text-neutral-600">
          אין פריטים בסטטוס הזה.
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => {
          const key = `${item.listingType}-${item.id}`;
          const ownerLabel =
            item.owner.businessName || item.owner.name || item.owner.email;
          return (
            <li
              key={key}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-emerald-950">
                    {item.listingTypeLabel}: {item.name}
                  </p>
                  {item.subtitle ? (
                    <p className="mt-0.5 text-xs text-neutral-600">{item.subtitle}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {ownerLabel} · גרסה {item.contentRevision} ·{" "}
                    {new Date(item.submittedForReviewAt).toLocaleString("he-IL")}
                  </p>
                  <div className="mt-2">
                    <ListingModerationBadge
                      status={item.moderationStatus}
                      note={item.moderationNote}
                    />
                  </div>
                </div>
                {item.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverImageUrl}
                    alt=""
                    className="h-16 w-24 rounded-lg border border-neutral-200 object-cover"
                  />
                ) : null}
              </div>

              {item.moderationStatus === "PENDING" ? (
                <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
                  <input
                    type="text"
                    dir="rtl"
                    value={rejectNote[key] ?? ""}
                    onChange={(e) =>
                      setRejectNote((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder="סיבת דחייה (רק אם דוחים)"
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs"
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <a
                      href={item.publicHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border px-3 py-1 text-xs text-neutral-700"
                    >
                      תצוגה (בעלים/אדמין)
                    </a>
                    <button
                      type="button"
                      disabled={busyKey === key}
                      onClick={() => void decide(item, "REJECTED")}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700"
                    >
                      דחה
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === key}
                      onClick={() => void decide(item, "APPROVED")}
                      className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-white"
                    >
                      אשר לפרסום
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
