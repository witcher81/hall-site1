"use client";

import { useId, useState } from "react";

const DEFAULT_INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200 bg-white py-2 pe-3 ps-11 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

type PasswordInputProps = {
  label: string;
  name: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  inputClassName?: string;
};

export default function PasswordInput({
  label,
  name,
  required = false,
  minLength,
  autoComplete,
  inputClassName = DEFAULT_INPUT_CLASS,
}: PasswordInputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-emerald-950"
          aria-label={visible ? "הסתר סיסמה" : "הצג סיסמה"}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeIcon className="h-[18px] w-[18px]" />
          ) : (
            <EyeOffIcon className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
}
