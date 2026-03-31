import type { ServiceCustomInclude } from "@/lib/serviceIncludes";

type Props = {
  includesEquipment: boolean;
  customIncludes: ServiceCustomInclude[];
  /** הסבר חופשי קצר — מוצג מתחת לתגיות כשקיים */
  includesNote?: string | null;
  className?: string;
  /** מידת טקסט לתגיות — ברירת מחדל לכרטיסים */
  size?: "sm" | "md";
};

export default function ServiceIncludeBadges({
  includesEquipment,
  customIncludes,
  includesNote,
  className = "",
  size = "md",
}: Props) {
  const checkedCustom = customIncludes.filter((x) => x.checked && x.label.trim());
  const noteTrim = includesNote?.trim() ?? "";
  const hasBadges =
    includesEquipment ||
    checkedCustom.length > 0;
  const hasNote = noteTrim.length > 0;

  if (!hasBadges && !hasNote) return null;

  const badge =
    size === "sm"
      ? "rounded-full bg-[#EFE6D5] px-2 py-0.5 text-[11px] text-[#0F3B2E]"
      : "rounded-full bg-[#EFE6D5] px-2 py-1 text-xs text-[#0F3B2E]";

  const noteText =
    size === "sm"
      ? "text-[11px] leading-relaxed text-[#5F5F5F]"
      : "text-xs leading-relaxed text-[#5F5F5F]";

  return (
    <div className={className}>
      {hasBadges && (
        <div className="flex flex-wrap gap-1">
          {includesEquipment && (
            <span className={badge}>כולל ציוד</span>
          )}
          {checkedCustom.map((c, i) => (
            <span key={`${c.label}-${i}`} className={badge}>
              {c.label.trim()}
            </span>
          ))}
        </div>
      )}
      {hasNote && (
        <p className={`${hasBadges ? "mt-1.5 " : ""}${noteText}`}>
          {noteTrim}
        </p>
      )}
    </div>
  );
}
