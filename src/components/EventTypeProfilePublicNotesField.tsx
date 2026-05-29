import { EVENT_TYPE_PUBLIC_NOTES_MAX } from "@/lib/venueEditFormParse";

export function EventTypeProfilePublicNotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="mt-2 border-t border-neutral-200/70 pt-3 sm:col-span-2">
      <label className="block text-xs font-medium text-neutral-800">
        הערות למחפשים על סוג האירוע הזה{" "}
        <span className="font-normal text-neutral-600">(אופציונלי)</span>
      </label>
      <p className="mt-0.5 text-[11px] text-neutral-600">
        יוצגו בדף האולם כשמחפשים לוחצים על סוג האירוע — למשל דגשים, שעות או מה
        כלול רק לסוג זה.
      </p>
      <textarea
        value={value}
        maxLength={EVENT_TYPE_PUBLIC_NOTES_MAX}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        placeholder="לדוגמה: בבר מצווה — אפשרות לעמדת מזנון בנפרד מהישיבה..."
        className="mt-1.5 w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
      />
      <p className="mt-1 text-[10px] text-[#8A8278]">
        {value.length}/{EVENT_TYPE_PUBLIC_NOTES_MAX} תווים
      </p>
    </div>
  );
}
