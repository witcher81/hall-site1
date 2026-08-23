"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminListRow from "@/components/admin/AdminListRow";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";
import { MODERATION_STATUS_HE } from "@/lib/adminUi";

type ContentItem = {
  listingType: "VENUE" | "SERVICE";
  listingTypeLabel: string;
  id: number;
  name: string;
  subtitle: string | null;
  moderationStatus: string;
  submittedForReviewAt: string;
  adminHref: string;
  owner: {
    id: number;
    email: string;
    name: string | null;
    businessName: string | null;
  };
};

export default function ContentListClient() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("APPROVED");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/admin/content?status=${encodeURIComponent(status)}`
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError("טעינת התוכן נכשלה");
      setItems([]);
      setLoading(false);
      return;
    }
    const merged = [
      ...(Array.isArray(data?.venues) ? data.venues : []),
      ...(Array.isArray(data?.services) ? data.services : []),
    ] as ContentItem[];
    merged.sort(
      (a, b) =>
        new Date(b.submittedForReviewAt).getTime() -
        new Date(a.submittedForReviewAt).getTime()
    );
    setItems(merged);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="תוכן באוויר"
        description="לחצו על פריט כדי לנהל — הסרה מהאוויר או החזרה."
      />

      <AdminFilterTabs
        ariaLabel="סינון תוכן"
        activeId={status}
        onChange={setStatus}
        tabs={[
          { id: "APPROVED", label: "באוויר" },
          { id: "REJECTED", label: "הוסר" },
          { id: "PENDING", label: "ממתין (ישן)" },
          { id: "ALL", label: "הכל" },
        ]}
      />

      {error ? <AdminErrorBanner message={error} onRetry={() => void load()} /> : null}
      {loading ? <p className="text-sm text-neutral-600">טוען…</p> : null}

      {!loading && !error && items.length === 0 ? (
        <AdminEmptyState title="אין פריטים בסטטוס הזה" />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => {
            const owner =
              item.owner.businessName || item.owner.name || item.owner.email;
            return (
              <li key={`${item.listingType}-${item.id}`}>
                <AdminListRow
                  href={item.adminHref}
                  title={`${item.listingTypeLabel}: ${item.name}`}
                  subtitle={item.subtitle ?? undefined}
                  meta={`${owner} · ${MODERATION_STATUS_HE[item.moderationStatus] ?? item.moderationStatus}`}
                  badge={MODERATION_STATUS_HE[item.moderationStatus]}
                  badgeTone={
                    item.moderationStatus === "REJECTED"
                      ? "rose"
                      : item.moderationStatus === "APPROVED"
                        ? "emerald"
                        : "amber"
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
