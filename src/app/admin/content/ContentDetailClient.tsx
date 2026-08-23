"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import ListingModerationBadge from "@/components/ListingModerationBadge";

type ContentItem = {
  listingType: "VENUE" | "SERVICE";
  listingTypeLabel: string;
  id: number;
  name: string;
  subtitle: string | null;
  moderationStatus: string;
  moderationNote: string | null;
  coverImageUrl: string | null;
  publicHref: string;
  owner: {
    id: number;
    email: string;
    name: string | null;
    businessName: string | null;
  };
};

type Props = {
  listingType: "VENUE" | "SERVICE";
  listingId: number;
  backHref?: string;
};

export default function ContentDetailClient({
  listingType,
  listingId,
  backHref = "/admin/content",
}: Props) {
  const router = useRouter();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmTakeDown, setConfirmTakeDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/admin/content?listingType=${listingType}&listingId=${listingId}`
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "טעינה נכשלה");
      setItem(null);
      setLoading(false);
      return;
    }
    setItem(data.item ?? null);
    setLoading(false);
  }, [listingType, listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && !note.trim()) {
      setError("נא לציין סיבה לפני הסרה מהאוויר");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingType,
        listingId,
        decision,
        note: decision === "REJECTED" ? note.trim() : null,
      }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    setConfirmTakeDown(false);
    if (!res.ok) {
      setError(data?.error || "הפעולה נכשלה");
      return;
    }
    void load();
  }

  if (loading) return <p className="text-sm text-neutral-600">טוען…</p>;

  if (error && !item) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="תוכן" backHref={backHref} />
        <AdminErrorBanner message={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (!item) return null;

  const ownerLabel =
    item.owner.businessName || item.owner.name || item.owner.email;
  const canTakeDown =
    item.moderationStatus === "APPROVED" ||
    item.moderationStatus === "PENDING";
  const canRestore = item.moderationStatus === "REJECTED";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${item.listingTypeLabel}: ${item.name}`}
        description={item.subtitle ?? undefined}
        backHref={backHref}
        backLabel="חזרה לתוכן"
      />

      {error ? <AdminErrorBanner message={error} onRetry={() => void load()} /> : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <ListingModerationBadge
              status={item.moderationStatus}
              note={item.moderationNote}
            />
          </div>
          <p className="text-sm text-neutral-600">
            בעלים:{" "}
            <Link
              href={`/admin/businesses/${item.owner.id}`}
              className="font-medium text-emerald-900 hover:underline"
            >
              {ownerLabel}
            </Link>
          </p>
          <p className="mt-4">
            <a
              href={item.publicHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              צפייה באתר ←
            </a>
          </p>
        </section>
        {item.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImageUrl}
            alt=""
            className="h-40 w-full rounded-xl border border-neutral-200 object-cover sm:w-56"
          />
        ) : null}
      </div>

      {canTakeDown ? (
        <label className="block text-sm">
          <span className="font-medium text-emerald-950">סיבה להסרה (חובה)</span>
          <input
            type="text"
            dir="rtl"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            placeholder="למה מסירים מהאוויר?"
          />
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {canTakeDown ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmTakeDown(true)}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            הסר מהאוויר
          </button>
        ) : null}
        {canRestore || item.moderationStatus === "PENDING" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void decide("APPROVED")}
            className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            {canRestore ? "החזר לאוויר" : "העלה לאוויר"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          חזרה לרשימה
        </button>
      </div>

      <AdminConfirmDialog
        open={confirmTakeDown}
        title="להסיר מהאוויר?"
        message="הפריט ייעלם מהחיפוש הציבורי. בעל התוכן יקבל התראה."
        confirmLabel="הסר"
        destructive
        busy={busy}
        onConfirm={() => void decide("REJECTED")}
        onCancel={() => setConfirmTakeDown(false)}
      />
    </div>
  );
}
