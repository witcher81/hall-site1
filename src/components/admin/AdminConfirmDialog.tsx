"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        <h3 id="admin-confirm-title" className="text-lg font-semibold text-emerald-950">
          {title}
        </h3>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              destructive
                ? "bg-red-700 hover:bg-red-800"
                : "bg-emerald-950 hover:bg-emerald-900"
            }`}
          >
            {busy ? "מבצע…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
