"use client";

import { useState } from "react";

const MIN_REASON_LEN = 10;

export default function ProviderCancelPaidModal({
  title,
  description,
  cancelUrl,
  onSuccess,
}: {
  title: string;
  description: string;
  cancelUrl: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(cancelUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          typeof data?.error === "string" ? data.error : "הביטול נכשל. נסו שוב."
        );
        return;
      }
      setOpen(false);
      setReason("");
      onSuccess?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800 transition hover:bg-red-100"
      >
        ביטול הזמנה ששולמה (החזר ללקוח)
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 text-right shadow-xl">
            <h3 className="text-base font-bold text-emerald-950">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              {description}
            </p>
            <label className="mt-4 block text-xs font-medium text-neutral-700">
              סיבת הביטול (חובה — הלקוח יראה)
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={pending}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 disabled:opacity-60"
              placeholder="למשל: התאריך כבר תפוס, בעיה טכנית באולם..."
            />
            {error && (
              <p className="mt-2 text-xs text-red-700" role="alert">
                {error}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                disabled={pending}
                className="rounded-full border border-neutral-200 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || reason.trim().length < MIN_REASON_LEN}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {pending ? "מבטל..." : "אשר ביטול והחזר"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
