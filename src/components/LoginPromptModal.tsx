"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  redirectPath?: string;
};

export default function LoginPromptModal({
  open,
  onClose,
  title = "התחברות נדרשת",
  message = "כדי לשמור למועדפים, התחברו או הירשמו לחשבון.",
  redirectPath,
}: Props) {
  if (!open) return null;

  const loginHref = redirectPath
    ? `/auth/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/auth/login";
  const registerHref = redirectPath
    ? `/auth/register?redirect=${encodeURIComponent(redirectPath)}`
    : "/auth/register";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px]"
        aria-label="סגור"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-right shadow-2xl"
      >
        <h2 id="login-prompt-title" className="text-lg font-bold text-emerald-950">
          {title}
        </h2>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <a
            href={loginHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-amber-400 px-4 text-sm font-semibold text-neutral-950 hover:bg-amber-300"
          >
            התחברות
          </a>
          <a
            href={registerHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-emerald-950/25 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
          >
            הרשמה
          </a>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-neutral-500 hover:text-neutral-700"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
