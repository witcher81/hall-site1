"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  /** טקסט שלב 1 */
  step1Message: string;
  /** מה צריך להקליד בשלב 2 (למשל אימייל או שם) */
  confirmPhrase: string;
  confirmPhraseLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * מחיקה עם אישור דו-שלבי:
 * 1) «האם אתה בטוח?»
 * 2) הקלדת ביטוי אישור + «מחק לצמיתות»
 */
export default function AdminTwoStepDeleteDialog({
  open,
  title,
  step1Message,
  confirmPhrase,
  confirmPhraseLabel = "הקלידו לאישור",
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setTyped("");
    }
  }, [open]);

  if (!open) return null;

  const phraseOk =
    typed.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-two-step-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        <p className="text-[11px] font-semibold text-red-700">
          שלב {step} מתוך 2 · מחיקה לצמיתות
        </p>
        <h3
          id="admin-two-step-title"
          className="mt-1 text-lg font-semibold text-emerald-950"
        >
          {title}
        </h3>

        {step === 1 ? (
          <>
            <p className="mt-2 text-sm text-neutral-600">{step1Message}</p>
            <p className="mt-2 text-xs text-red-800">
              הפעולה אינה ניתנת לביטול. כל הנתונים הקשורים יימחקו.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep(2)}
                className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                המשך למחיקה
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-600">
              לאישור סופי הקלידו בדיוק:{" "}
              <span className="font-mono font-semibold text-emerald-950">
                {confirmPhrase}
              </span>
            </p>
            <label className="mt-3 block text-xs font-medium text-neutral-600">
              {confirmPhraseLabel}
              <input
                type="text"
                dir="ltr"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                placeholder={confirmPhrase}
              />
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep(1);
                  setTyped("");
                }}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                חזרה
              </button>
              <button
                type="button"
                disabled={busy || !phraseOk}
                onClick={onConfirm}
                className="rounded-full bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-50"
              >
                {busy ? "מוחק…" : "מחק לצמיתות"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
