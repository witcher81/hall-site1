"use client";

import Link from "next/link";
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

const TARGET_LABELS: Record<string, string> = {
  venue: "אולם",
  service: "שירות",
  provider: "ספק",
};

function targetHref(targetType: string, targetId: number): string | null {
  if (targetType === "venue") return `/halls/${targetId}`;
  if (targetType === "service") return `/services/${targetId}`;
  if (targetType === "provider") return `/providers/${targetId}`;
  return null;
}

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

  if (loading) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
        טוען דיווחים...
      </p>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
        אין דיווחים פתוחים כרגע.
      </p>
    );
  }

  return (
    <ul className="space-y-3 text-right text-sm">
      {reports.map((r) => {
        const href = targetHref(r.targetType, r.targetId);
        const typeLabel = TARGET_LABELS[r.targetType] ?? r.targetType;
        return (
          <li
            key={r.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-emerald-950">
                  דיווח #{r.id} — {typeLabel} #{r.targetId}
                </p>
                {href ? (
                  <p className="mt-1 text-xs">
                    <Link
                      href={href}
                      target="_blank"
                      className="font-medium text-emerald-900 underline-offset-2 hover:underline"
                    >
                      צפייה בתוכן באתר ←
                    </Link>
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-neutral-800">{r.reason}</p>
                {r.details ? (
                  <p className="mt-1 text-xs text-neutral-600">{r.details}</p>
                ) : null}
                <p className="mt-2 text-[11px] text-neutral-500">
                  {r.reporter?.name || r.reporter?.email || "אורח"} ·{" "}
                  {new Date(r.createdAt).toLocaleString("he-IL")} · {r.status}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-neutral-100 pt-3">
              <button
                type="button"
                onClick={() => setStatus(r.id, "DISMISSED")}
                className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                דחה
              </button>
              <button
                type="button"
                onClick={() => setStatus(r.id, "RESOLVED")}
                className="rounded-full bg-emerald-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
              >
                טופל
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
