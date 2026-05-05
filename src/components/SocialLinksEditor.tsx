"use client";

import type { SocialLink, SocialPlatformId } from "@/lib/socialLinks";
import { normalizeSocialUrl, SOCIAL_PLATFORM_OPTIONS } from "@/lib/socialLinks";

type Props = {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  /** כותרת מעל הבלוק */
  title?: string;
  /** הסבר קצר מתחת לכותרת */
  description?: string;
  /** טקסט כפתור הוספה */
  addButtonText?: string;
};

const emptyLink = (): SocialLink => ({
  platform: "instagram",
  url: "",
});

export default function SocialLinksEditor({
  value,
  onChange,
  title = "קישורים לאתר, פורטפוליו ורשתות חברתיות",
  description = "הוסיפו קישור מלא לכל רשת: בחרו רשת, הדביקו כתובת מלאה (כולל https://) ולחצו על כפתור ההוספה כדי להוסיף שורה נוספת.",
  addButtonText = "+ הוסף רשת / קישור",
}: Props) {
  const input =
    "mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40";

  function addRow() {
    onChange([...value, emptyLink()]);
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateRow(
    index: number,
    patch: Partial<{ platform: SocialPlatformId; url: string }>
  ) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[#5F5F5F]">{title}</label>
      <div className="mt-3 space-y-3">
        {value.map((row, index) => {
          const hasValue = row.url.trim().length > 0;
          const isValid = !hasValue || normalizeSocialUrl(row.url) !== null;
          return (
            <div
              key={`social-row-${index}`}
              className="flex flex-col gap-2 rounded-xl border border-[#E8E0D4] bg-[#FAF8F4] p-3 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-[#5F5F5F]">רשת</span>
              <select
                value={row.platform}
                onChange={(e) =>
                  updateRow(index, {
                    platform: e.target.value as SocialPlatformId,
                  })
                }
                className={input}
              >
                {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              </div>
              <div className="min-w-0 flex-[2]">
                <span className="block text-xs font-medium text-[#5F5F5F]">
                  קישור מלא
                </span>
                <input
                  type="text"
                  dir="ltr"
                  value={row.url}
                  onChange={(e) => updateRow(index, { url: e.target.value })}
                  className={input}
                  placeholder="https://..."
                />
                {!isValid && (
                  <p className="mt-1 text-[11px] text-red-700">
                    הקישור לא תקין. יש להזין כתובת מלאה או דומיין תקין.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-700 hover:bg-red-50"
              >
                הסרה
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 rounded-xl border border-[#0F3B2E]/35 bg-white px-5 py-2.5 text-sm font-semibold text-[#0F3B2E] shadow-sm hover:bg-[#EFE6D5]"
      >
        {addButtonText}
      </button>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-[#4E4A45]">{description}</p>
      )}
    </div>
  );
}
