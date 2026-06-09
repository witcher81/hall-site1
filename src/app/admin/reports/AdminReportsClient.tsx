"use client";

import { useEffect, useState } from "react";

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

export default function AdminReportsClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/reports");
    const data = await res.json().catch(() => null);
    setReports(Array.isArray(data?.reports) ? data.reports : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: number, status: string) {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    void load();
  }

  if (loading) return <p className="text-sm text-neutral-600">טוען...</p>;

  return (
    <ul className="space-y-3 text-right text-sm">
      {reports.length === 0 && <li className="text-neutral-600">אין דיווחים פתוחים.</li>}
      {reports.map((r) => (
        <li key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="font-semibold text-emerald-950">
            #{r.id} — {r.targetType} {r.targetId}
          </p>
          <p className="mt-1 text-xs text-neutral-600">{r.reason}</p>
          {r.details && <p className="mt-1 text-xs">{r.details}</p>}
          <p className="mt-1 text-[11px] text-neutral-500">
            {r.reporter?.email ?? "אורח"} · {r.status}
          </p>
          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setStatus(r.id, "RESOLVED")}
              className="rounded-full border px-3 py-1 text-xs"
            >
              טופל
            </button>
            <button
              type="button"
              onClick={() => setStatus(r.id, "DISMISSED")}
              className="rounded-full border px-3 py-1 text-xs"
            >
              דחה
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
