"use client";

import { useState } from "react";

type Props = {
  targetType: "venue" | "service" | "provider";
  targetId: number;
};

export default function ReportContentButton({ targetType, targetId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || "שליחה נכשלה");
        setSending(false);
        return;
      }
      setMessage("הדיווח נשלח. תודה.");
      setOpen(false);
    } catch {
      setMessage("שגיאה בלתי צפויה");
    }
    setSending(false);
  }

  return (
    <div className="text-right text-xs">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-neutral-500 underline hover:text-emerald-950"
        >
          דווח על תוכן
        </button>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="סיבת הדיווח"
            required
            className="w-full rounded-lg border border-neutral-200 px-2 py-1.5"
          />
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="פרטים (אופציונלי)"
            rows={2}
            className="w-full rounded-lg border border-neutral-200 px-2 py-1.5"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="text-neutral-600">
              ביטול
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-full bg-neutral-800 px-3 py-1 text-white disabled:opacity-60"
            >
              שליחה
            </button>
          </div>
        </form>
      )}
      {message && <p className="mt-1 text-emerald-800">{message}</p>}
    </div>
  );
}
