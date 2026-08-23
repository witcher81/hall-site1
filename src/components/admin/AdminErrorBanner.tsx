"use client";

type Props = {
  message: string;
  onRetry?: () => void;
};

export default function AdminErrorBanner({ message, onRetry }: Props) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-100"
        >
          נסה שוב
        </button>
      ) : null}
    </div>
  );
}
