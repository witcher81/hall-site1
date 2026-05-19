import { EVENT_TYPE_PUBLIC_NOTES_MAX } from "@/lib/venueEditFormParse";

export function EventTypeProfilePublicNotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="mt-2 border-t border-[#E0D4C3]/70 pt-3 sm:col-span-2">
      <label className="block text-xs font-medium text-[#2A261F]">
        הערות למחפשים על סוג האירוע הזה{" "}
        <span className="font-normal text-[#6B6560]">(אופציונלי)</span>
      </label>
      <p className="mt-0.5 text-[11px] text-[#6B6560]">
        יוצגו בדף האולם כשמחפשים לוחצים על סוג האירוע — למשל דגשים, שעות או מה
        כלול רק לסוג זה.
      </p>
      <textarea
        value={value}
        maxLength={EVENT_TYPE_PUBLIC_NOTES_MAX}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        placeholder="לדוגמה: בבר מצווה — אפשרות לעמדת מזנון בנפרד מהישיבה..."
        className="mt-1.5 w-full resize-y rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30"
      />
      <p className="mt-1 text-[10px] text-[#8A8278]">
        {value.length}/{EVENT_TYPE_PUBLIC_NOTES_MAX} תווים
      </p>
    </div>
  );
}
