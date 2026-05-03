"use client";

import { useMemo, useState } from "react";
import {
  AFTER_VENUE_EVENT_TYPE_OPTIONS,
  gapSuggestionsForEventType,
  providersHrefForCategory,
  type SavingsOpportunityPayload,
} from "@/lib/venueAfterHallGuide";

type Props = {
  venueId: number;
  venueName: string;
  venueCity: string;
  savingsOpportunities: SavingsOpportunityPayload[];
  defaultEventType: string;
  eventTypesOffered: string[];
};

export default function AfterVenueGuideClient({
  venueId,
  venueName,
  venueCity,
  savingsOpportunities,
  defaultEventType,
  eventTypesOffered,
}: Props) {
  const [eventType, setEventType] = useState(defaultEventType);
  const [interestByGapId, setInterestByGapId] = useState<Record<string, boolean | null>>({});

  const gaps = useMemo(() => gapSuggestionsForEventType(eventType), [eventType]);

  function setGapInterest(id: string, value: boolean | null) {
    setInterestByGapId((prev) => ({ ...prev, [id]: value }));
  }

  const interestedGaps = gaps.filter((g) => interestByGapId[g.id] === true);

  return (
    <div className="space-y-8 text-right">
      <header className="border-b border-[#E0D4C3] pb-6">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">אחרי שבחרתם אולם</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6B6560]">
          בחרתם ב־<strong className="text-[#2A261F]">{venueName}</strong>
          {venueCity ? ` · ${venueCity}` : ""}. כאן משווים תוספות בתשלום באולם מול ספקים
          במאגר, ואז אפשר לסמן מה עוד מעניין אתכם — בלי התחייבות. בכל שלב אפשר לחזור או לדלג.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E0D4C3] bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#0F3B2E]">סוג האירוע שלכם</h2>
        <p className="mt-1 text-xs text-[#6B6560]">
          ההצעות למטה מותאמות לסוג — אפשר לשנות בכל רגע.
          {eventTypesOffered.length > 0 ? (
            <span className="block pt-1">
              האולם מציין: {eventTypesOffered.join(" · ")}
            </span>
          ) : null}
        </p>
        <select
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value);
            setInterestByGapId({});
          }}
          className="mt-3 w-full rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227]"
        >
          {AFTER_VENUE_EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl border border-[#E0D4C3] bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#0F3B2E]">השוואת תוספות (בתשלום באולם)</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#6B6560]">
          כשהאולם מציין מחיר בתוספת לשירות, אנחנו מחפשים במאגר ספקים מאותה קטגוריה עם מחיר
          מינימום מוצהר. אם נמצא זול יותר — מציגים את ההפרש כרמז בלבד (המחירים באולם ובמאגר
          נשארים לפי מה שהוגדר שם).
        </p>
        {savingsOpportunities.length === 0 ? (
          <p className="mt-4 rounded-xl bg-[#FAF8F4] px-3 py-3 text-sm text-[#6B6560]">
            אין כרגע תוספות בתשלום שמיפינו לקטגוריית ספקים — אפשר להמשיך לסעיף הבא או לעבור
            ישר ל־
            <a href="/providers" className="font-semibold text-[#0F3B2E] underline">
              שירותי ספקים
            </a>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {savingsOpportunities.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-[#E8E0D6] bg-[#FFFBF7] px-3 py-3 text-sm"
              >
                <p className="font-semibold text-[#2A261F]">{row.hallLabel}</p>
                <p className="mt-1 text-xs text-[#6B6560]">
                  באולם בתוספת:{" "}
                  <span className="tabular-nums font-medium text-[#1A1A1A]">
                    ₪{row.hallPrice}
                  </span>
                  {row.marketFrom != null ? (
                    <>
                      {" "}
                      · במאגר (מחיר מינימום מוצהר):{" "}
                      <span className="tabular-nums font-medium text-[#1A1A1A]">
                        ₪{row.marketFrom}
                      </span>
                    </>
                  ) : (
                    <span> · אין עדיין מחיר מינימום במאגר לקטגוריה «{row.category}»</span>
                  )}
                </p>
                {row.cheaperThanHall ? (
                  <p className="mt-2 text-xs font-medium text-[#0F3B2E]">
                    רמז: לפי המאגר, אפשר לבדוק ספקים בקטגוריה «{row.category}» במחיר נמוך יותר
                    מהתוספת באולם.
                  </p>
                ) : null}
                <a
                  href={providersHrefForCategory(row.category)}
                  className="mt-2 inline-block text-xs font-semibold text-[#0F3B2E] underline-offset-2 hover:underline"
                >
                  עבור לחיפוש בקטגוריה {row.category} →
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[#0F3B2E]/20 bg-gradient-to-br from-[#E8F0EC]/80 to-[#FAF8F4] p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#0F3B2E]">מה עוד מעניין אתכם?</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#6B6560]">
          זה לא ניתוח &quot;מה חסר&quot; בפועל — רק הצעות נפוצות לפי סוג האירוע. סמנו כן אם
          תרצו שנפתח לכם קישור לחיפוש; לא — אם לא רלוונטי. אפשר לשנות בכל רגע.
        </p>
        <ul className="mt-4 space-y-4">
          {gaps.map((g) => {
            const v = interestByGapId[g.id];
            return (
              <li
                key={g.id}
                className="rounded-xl border border-[#E0D4C3] bg-white/90 px-3 py-3 text-sm"
              >
                <p className="font-semibold text-[#2A261F]">{g.title}</p>
                <p className="mt-1 text-xs text-[#6B6560]">{g.body}</p>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setGapInterest(g.id, true)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      v === true
                        ? "bg-[#0F3B2E] text-white"
                        : "border border-[#D4C9BC] bg-white text-[#2A261F] hover:bg-[#FAF8F4]"
                    }`}
                  >
                    כן, מעניין
                  </button>
                  <button
                    type="button"
                    onClick={() => setGapInterest(g.id, false)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      v === false
                        ? "bg-[#6B6560] text-white"
                        : "border border-[#D4C9BC] bg-white text-[#2A261F] hover:bg-[#FAF8F4]"
                    }`}
                  >
                    לא
                  </button>
                  <button
                    type="button"
                    onClick={() => setGapInterest(g.id, null)}
                    className="text-[11px] text-[#6B6560] underline-offset-2 hover:underline"
                  >
                    נקה בחירה
                  </button>
                </div>
                {v === true && g.category ? (
                  <a
                    href={providersHrefForCategory(g.category)}
                    className="mt-2 inline-block text-xs font-bold text-[#C9A227] underline-offset-2 hover:underline"
                  >
                    פתח חיפוש ב־{g.category} →
                  </a>
                ) : null}
                {v === true && !g.category ? (
                  <a
                    href="/providers"
                    className="mt-2 inline-block text-xs font-bold text-[#C9A227] underline-offset-2 hover:underline"
                  >
                    פתח את מאגר שירותי הספקים →
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
        {interestedGaps.length > 0 ? (
          <p className="mt-4 text-xs text-[#5F5F5F]">
            סימנתם עניין ב־{interestedGaps.length} קטגוריות — אפשר להמשיך לשלוח בקשות ישירות
            מהדפים של הספקים.
          </p>
        ) : null}
      </section>

      <footer className="flex flex-col gap-3 border-t border-[#E0D4C3] pt-6 text-sm">
        <a
          href={`/halls/${venueId}`}
          className="inline-flex items-center justify-center rounded-2xl border-2 border-[#0F3B2E]/25 bg-white px-4 py-3 font-semibold text-[#0F3B2E] transition hover:bg-[#E8F0EC]"
        >
          חזרה לדף האולם
        </a>
        <a
          href={`/halls/${venueId}/inquiry`}
          className="inline-flex items-center justify-center rounded-2xl bg-[#C9A227] px-4 py-3 font-bold text-white shadow transition hover:bg-[#E5C96B]"
        >
          המשך לשליחת בקשה לאולם
        </a>
        <p className="text-center text-[11px] text-[#6B6560]">
          לא רוצים את המסלול הזה? פשוט סגרו את הדף או חזרו לאולם — אין שמירה בשרת בשלב זה.
        </p>
      </footer>
    </div>
  );
}
