import type {
  ServiceCustomInclude,
  ServicePaidExtraItem,
} from "@/lib/serviceIncludes";

type Props = {
  includesTravel?: boolean;
  includesEquipment: boolean;
  customIncludes: ServiceCustomInclude[];
  paidExtras?: ServicePaidExtraItem[];
  /** הסבר חופשי קצר — מוצג מתחת לתגיות כשקיים */
  includesNote?: string | null;
  className?: string;
  /** מידת טקסט לתגיות — ברירת מחדל לכרטיסים */
  size?: "sm" | "md";
};

export default function ServiceIncludeBadges({
  includesTravel = false,
  includesEquipment,
  customIncludes,
  paidExtras = [],
  includesNote,
  className = "",
  size = "md",
}: Props) {
  function paidPriceText(p: ServicePaidExtraItem): string {
    if (p.exactPrice != null) return `₪${p.exactPrice}`;
    if (p.minPrice != null && p.maxPrice != null) {
      if (p.minPrice === p.maxPrice) return `₪${p.minPrice}`;
      return `₪${p.minPrice}–₪${p.maxPrice}`;
    }
    if (p.minPrice != null) return `החל מ־₪${p.minPrice}`;
    if (p.maxPrice != null) return `עד ₪${p.maxPrice}`;
    return "";
  }

  const checkedCustom = customIncludes.filter(
    (x) => x.checked && x.label.trim()
  );
  const paidList = paidExtras.filter((p) => p.label.trim());
  const noteTrim = includesNote?.trim() ?? "";
  const hasTravel = includesTravel;
  const hasEquipment = includesEquipment;
  const hasFreeList = checkedCustom.length > 0;
  const hasPaid = paidList.length > 0;
  const hasNote = noteTrim.length > 0;

  if (!hasTravel && !hasEquipment && !hasFreeList && !hasPaid && !hasNote) return null;

  const badge =
    size === "sm"
      ? "rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] text-emerald-950"
      : "rounded-full bg-neutral-50 px-2 py-1 text-xs text-emerald-950";

  const noteText =
    size === "sm"
      ? "text-[11px] leading-relaxed text-neutral-600"
      : "text-xs leading-relaxed text-neutral-600";

  const itemTitle =
    size === "sm" ? "text-[11px] font-semibold text-emerald-950" : "text-xs font-semibold text-emerald-950";
  const itemDesc =
    size === "sm"
      ? "mt-0.5 text-[10px] leading-relaxed text-neutral-600"
      : "mt-0.5 text-[11px] leading-relaxed text-neutral-600";

  return (
    <div className={className}>
      {(hasTravel || hasEquipment) && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {hasTravel ? <span className={badge}>כולל נסיעות</span> : null}
          {hasEquipment ? <span className={badge}>כולל ציוד</span> : null}
        </div>
      )}

      {hasFreeList && (
        <ul className="space-y-1.5">
          {checkedCustom.map((c, i) => (
            <li key={`${c.label}-${i}`} className="text-right">
              <p className={itemTitle}>{c.label.trim()}</p>
              {c.description?.trim() ? (
                <p className={itemDesc}>{c.description.trim()}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {hasNote && (
        <p
          className={`${noteText}${hasTravel || hasEquipment || hasFreeList || hasPaid ? " mt-1.5" : ""}`}
        >
          {noteTrim}
        </p>
      )}

      {hasPaid && (
        <div
          className={`${hasTravel || hasEquipment || hasFreeList || hasNote ? "mt-2.5 border-t border-neutral-200/80 pt-2" : ""}`}
        >
          <p className={`${size === "sm" ? "text-[10px]" : "text-[11px]"} font-semibold text-amber-900/90`}>
            ניתן בתוספת תשלום
          </p>
          <ul className="mt-1 space-y-1.5">
            {paidList.map((p, i) => (
              <li key={`paid-${p.label}-${i}`} className="text-right">
                <p className={itemTitle}>
                  {p.label.trim()}
                  {paidPriceText(p) ? (
                    <span className="mr-1 font-medium text-amber-900/90">
                      ({paidPriceText(p)})
                    </span>
                  ) : null}
                </p>
                {p.description?.trim() ? (
                  <p className={itemDesc}>{p.description.trim()}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
