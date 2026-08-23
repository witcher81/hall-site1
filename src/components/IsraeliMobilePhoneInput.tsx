"use client";

import {
  ISRAELI_MOBILE_PREFIXES,
  composeIsraeliMobilePhone,
  normalizePhoneInput,
  splitIsraeliMobilePhone,
} from "@/lib/phone";

type Props = {
  value: string;
  onChange: (full: string) => void;
  /** נייד בלבד (פרופיל ספק) — תמיד קידומת + 7 ספרות */
  forceMobile?: boolean;
  selectClassName?: string;
  inputClassName?: string;
  /** מחלקה לשדה מלא כשנייד לא מתאים (הגדרות / מספר קווי) */
  legacyInputClassName?: string;
};

export default function IsraeliMobilePhoneInput({
  value,
  onChange,
  forceMobile = true,
  selectClassName,
  inputClassName,
  legacyInputClassName,
}: Props) {
  const digits = normalizePhoneInput(value);
  const useMobileUi = forceMobile || !digits || digits.startsWith("05");

  const defaultSelect = "site-input shrink-0 w-auto px-2 py-2.5 text-sm";
  const defaultInput = "site-input min-w-0 flex-1 py-2.5 text-sm";

  if (!useMobileUi) {
    return (
      <input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        value={value}
        onChange={(e) => onChange(normalizePhoneInput(e.target.value))}
        className={legacyInputClassName ?? "site-input mt-1 py-2.5"}
        placeholder="03-xxxxxxx או 05xxxxxxxx"
      />
    );
  }

  const { prefix, rest } = splitIsraeliMobilePhone(value);

  return (
    <div className="mt-1 flex flex-row gap-2" dir="ltr">
      <select
        className={selectClassName ?? defaultSelect}
        value={prefix}
        aria-label="קידומת נייד"
        onChange={(e) =>
          onChange(composeIsraeliMobilePhone(e.target.value, rest))
        }
      >
        {ISRAELI_MOBILE_PREFIXES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={7}
        className={inputClassName ?? defaultInput}
        value={rest}
        onChange={(e) =>
          onChange(composeIsraeliMobilePhone(prefix, e.target.value))
        }
        placeholder="1234567"
      />
    </div>
  );
}
