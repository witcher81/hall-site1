"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import {
  REPORT_STATUS_HE,
  TARGET_TYPE_HE,
  publicTargetHref,
  adminContentHref,
} from "@/lib/adminUi";

type Report = {
  id: number;
  targetType: string;
  targetId: number;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { email: string; name: string | null } | null;
};

type Props = { reportId: number };

export default function ReportDetailClient({ reportId }: Props) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/reports?id=${reportId}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "טעינה נכשלה");
      setReport(null);
      setLoading(false);
      return;
    }
    setReport(data.report ?? null);
    setLoading(false);
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(status: string) {
    setBusy(true);
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reportId, status }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("עדכון הסטטוס נכשל");
      return;
    }
    void load();
  }

  if (loading) return <p className="text-sm text-neutral-600">טוען…</p>;

  if (error && !report) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="דיווח" backHref="/admin/reports" />
        <AdminErrorBanner message={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (!report) return null;

  const publicHref = publicTargetHref(report.targetType, report.targetId);
  const adminContentLink =
    report.targetType === "venue"
      ? adminContentHref("VENUE", report.targetId)
      : report.targetType === "service"
        ? adminContentHref("SERVICE", report.targetId)
        : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`דיווח #${report.id}`}
        description={`${TARGET_TYPE_HE[report.targetType] ?? report.targetType} #${report.targetId} · ${REPORT_STATUS_HE[report.status] ?? report.status}`}
        backHref="/admin/reports"
        backLabel="חזרה לדיווחים"
      />

      {error ? <AdminErrorBanner message={error} onRetry={() => void load()} /> : null}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p className="font-semibold text-emerald-950">{report.reason}</p>
        {report.details ? (
          <p className="mt-2 text-sm text-neutral-700">{report.details}</p>
        ) : null}
        <p className="mt-3 text-xs text-neutral-500">
          מדווח: {report.reporter?.name || report.reporter?.email || "אורח"} ·{" "}
          {new Date(report.createdAt).toLocaleString("he-IL", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        {publicHref ? (
          <a
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            צפייה בתוכן באתר ←
          </a>
        ) : null}
        {adminContentLink ? (
          <Link
            href={adminContentLink}
            className="rounded-xl border border-emerald-800/30 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-100"
          >
            ניהול תוכן בפאנל
          </Link>
        ) : null}
      </div>

      {report.status === "OPEN" ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void setStatus("RESOLVED")}
            className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            סמן כטופל
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setStatus("DISMISSED")}
            className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 disabled:opacity-50"
          >
            דחה דיווח
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => router.push("/admin/reports")}
        className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        חזרה לרשימה
      </button>
    </div>
  );
}
