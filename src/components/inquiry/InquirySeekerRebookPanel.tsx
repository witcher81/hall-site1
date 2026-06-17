"use client";

import { useRouter } from "next/navigation";
import { seedInquiryDraftFromSnapshot } from "@/lib/inquiryDraft";
import {
  buildInquiryDraftFromSnapshot,
  type InquiryRebookSnapshot,
} from "@/lib/inquiryRebook";

type Props = {
  venueId: number;
  snapshot: InquiryRebookSnapshot;
  /** הצג גם כפתור לתאריך אחר (בעיקר אחרי דחייה) */
  showDateChange?: boolean;
};

export default function InquirySeekerRebookPanel({
  venueId,
  snapshot,
  showDateChange = true,
}: Props) {
  const router = useRouter();

  function startRebook(mode: "date" | "edit") {
    const draft = buildInquiryDraftFromSnapshot(snapshot, mode);
    seedInquiryDraftFromSnapshot(venueId, draft);
    router.push(`/halls/${venueId}/inquiry?rebook=${mode}`);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-950/15 bg-gradient-to-br from-[#FFFCF7] to-emerald-50/40 p-4 shadow-sm">
      <p className="font-serif text-sm font-semibold text-emerald-950">רוצים לנסות שוב?</p>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-700">
        אפשר לשלוח בקשה חדשה לאותו אולם — עם תאריך אחר, או לערוך ספקים והצעות לפני שליחה.
        הבקשה הקודמת תישאר בהיסטוריה.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {showDateChange ? (
          <button
            type="button"
            onClick={() => startRebook("date")}
            className="flex-1 rounded-xl bg-emerald-950 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-emerald-900"
          >
            בקשה לתאריך אחר
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => startRebook("edit")}
          className={`rounded-xl border border-emerald-950/25 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-50/80 ${
            showDateChange ? "flex-1" : "w-full sm:w-auto"
          }`}
        >
          עריכת בקשה ושליחה מחדש
        </button>
      </div>
      <p className="mt-2.5 text-[10px] text-neutral-500">
        בעריכה — אפשר להוסיף ספקים, להחליף חלופה במאגר, או לעדכן הודעות לפני שליחה.
      </p>
    </div>
  );
}
