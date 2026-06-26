"use client";

import { useId, useState } from "react";

const DEFAULT_INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200 bg-white py-2 pe-3 ps-10 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40";

type PasswordInputProps = {
  label: string;
  name: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  inputClassName?: string;
  /** שליטה משותפת (למשל שני שדות סיסמה באותו טופס) */
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
};

export default function PasswordInput({
  label,
  name,
  required = false,
  minLength,
  autoComplete,
  inputClassName = DEFAULT_INPUT_CLASS,
  visible: controlledVisible,
  onVisibleChange,
}: PasswordInputProps) {
  const id = useId();
  const [internalVisible, setInternalVisible] = useState(false);
  const visible = controlledVisible ?? internalVisible;
  const setVisible = onVisibleChange ?? setInternalVisible;

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
          onClick={() => setVisible(!visible)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-emerald-950"
          aria-label={visible ? "הסתר סיסמה" : "הצג סיסמה"}
          aria-pressed={visible}
        >
          {visible ? "הסתר" : "הצג"}
        </button>
      </div>
    </div>
  );
}
