"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminListRow from "@/components/admin/AdminListRow";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";
import { REPORT_STATUS_HE, TARGET_TYPE_HE } from "@/lib/adminUi";

type Report = {
  id: number;
  targetType: string;
  targetId: number;
  reason: string;
  status: string;
  createdAt: string;
};

export default function ReportsListClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("OPEN");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = status === "HISTORY" ? "ALL" : status;
    const res = await fetch(`/api/admin/reports?status=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError("טעינת הדיווחים נכשלה");
      setReports([]);
      setLoading(false);
      return;
    }
    let list = Array.isArray(data?.reports) ? data.reports : [];
    if (status === "HISTORY") {
      list = list.filter((r: Report) => r.status !== "OPEN");
    }
    setReports(list);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="דיווחי תוכן"
        description="לחצו על דיווח לפרטים, קישור לתוכן וסגירה."
      />

      <AdminFilterTabs
        ariaLabel="סינון דיווחים"
        activeId={status}
        onChange={setStatus}
        tabs={[
          { id: "OPEN", label: "פתוחים" },
          { id: "HISTORY", label: "טופלו / נדחו" },
        ]}
      />

      {error ? <AdminErrorBanner message={error} onRetry={() => void load()} /> : null}
      {loading ? <p className="text-sm text-neutral-600">טוען…</p> : null}

      {!loading && !error && reports.length === 0 ? (
        <AdminEmptyState title="אין דיווחים בסטטוס הזה" />
      ) : null}

      {!loading && !error && reports.length > 0 ? (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id}>
              <AdminListRow
                href={`/admin/reports/${r.id}`}
                title={r.reason}
                subtitle={`${TARGET_TYPE_HE[r.targetType] ?? r.targetType} #${r.targetId}`}
                meta={`${REPORT_STATUS_HE[r.status] ?? r.status} · ${new Date(r.createdAt).toLocaleString("he-IL", { dateStyle: "medium", timeStyle: "short" })}`}
                badge={REPORT_STATUS_HE[r.status] ?? r.status}
                badgeTone={r.status === "OPEN" ? "rose" : "neutral"}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
