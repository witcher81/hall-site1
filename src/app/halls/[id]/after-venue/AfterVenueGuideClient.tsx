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
      <header className="site-page-header">
        <p className="site-kicker">המשך אחרי בחירת אולם</p>
        <h1 className="site-page-title">אחרי שבחרתם אולם</h1>
        <p className="site-page-lead">
          בחרתם ב־<strong className="text-neutral-800">{venueName}</strong>
          {venueCity ? ` · ${venueCity}` : ""}. כאן משווים תוספות בתשלום באולם מול ספקים
          במאגר, ואז אפשר לסמן מה עוד מעניין אתכם — בלי התחייבות. בכל שלב אפשר לחזור או לדלג.
        </p>
      </header>

      <section className="site-card-padded">
        <h2 className="text-base font-bold text-emerald-950">סוג האירוע שלכם</h2>
        <p className="mt-1 text-xs text-neutral-600">
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
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-amber-400"
        >
          {AFTER_VENUE_EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </section>

      <section className="site-card-padded">
        <h2 className="text-base font-bold text-emerald-950">השוואת תוספות (בתשלום באולם)</h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          כשהאולם מציין מחיר בתוספת לשירות, אנחנו מחפשים במאגר ספקים מאותה קטגוריה עם מחיר
          מינימום מוצהר. אם נמצא זול יותר — מציגים את ההפרש כרמז בלבד (המחירים באולם ובמאגר
          נשארים לפי מה שהוגדר שם).
        </p>
        {savingsOpportunities.length === 0 ? (
          <p className="mt-4 rounded-xl bg-neutral-50 px-3 py-3 text-sm text-neutral-600">
            אין כרגע תוספות בתשלום שמיפינו לקטגוריית ספקים — אפשר להמשיך לסעיף הבא או לעבור
            ישר ל־
            <a href="/providers" className="font-semibold text-emerald-950 underline">
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
                <p className="font-semibold text-neutral-800">{row.hallLabel}</p>
                <p className="mt-1 text-xs text-neutral-600">
                  באולם בתוספת:{" "}
                  <span className="tabular-nums font-medium text-neutral-900">
                    ₪{row.hallPrice}
                  </span>
                  {row.marketFrom != null ? (
                    <>
                      {" "}
                      · במאגר (מחיר מינימום מוצהר):{" "}
                      <span className="tabular-nums font-medium text-neutral-900">
                        ₪{row.marketFrom}
                      </span>
                    </>
                  ) : (
                    <span> · אין עדיין מחיר מינימום במאגר לקטגוריה «{row.category}»</span>
                  )}
                </p>
                {row.cheaperThanHall ? (
                  <p className="mt-2 text-xs font-medium text-emerald-950">
                    רמז: לפי המאגר, אפשר לבדוק ספקים בקטגוריה «{row.category}» במחיר נמוך יותר
                    מהתוספת באולם.
                  </p>
                ) : null}
                <a
                  href={providersHrefForCategory(row.category, row.secondary)}
                  className="mt-2 inline-block text-xs font-semibold text-emerald-950 underline-offset-2 hover:underline"
                >
                  עבור לחיפוש בקטגוריה {row.category} →
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="site-card-padded border-amber-300/40 bg-gradient-to-br from-emerald-50/80 to-amber-50/50">
        <h2 className="text-base font-bold text-emerald-950">מה עוד מעניין אתכם?</h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          זה לא ניתוח &quot;מה חסר&quot; בפועל — רק הצעות נפוצות לפי סוג האירוע. סמנו כן אם
          תרצו שנפתח לכם קישור לחיפוש; לא — אם לא רלוונטי. אפשר לשנות בכל רגע.
        </p>
        <ul className="mt-4 space-y-4">
          {gaps.map((g) => {
            const v = interestByGapId[g.id];
            return (
              <li
                key={g.id}
                className="rounded-xl border border-neutral-200 bg-white/90 px-3 py-3 text-sm"
              >
                <p className="font-semibold text-neutral-800">{g.title}</p>
                <p className="mt-1 text-xs text-neutral-600">{g.body}</p>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setGapInterest(g.id, true)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      v === true
                        ? "bg-emerald-950 text-white"
                        : "border border-[#D4C9BC] bg-white text-neutral-800 hover:bg-neutral-50"
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
                        : "border border-[#D4C9BC] bg-white text-neutral-800 hover:bg-neutral-50"
                    }`}
                  >
                    לא
                  </button>
                  <button
                    type="button"
                    onClick={() => setGapInterest(g.id, null)}
                    className="text-[11px] text-neutral-600 underline-offset-2 hover:underline"
                  >
                    נקה בחירה
                  </button>
                </div>
                {v === true && g.category ? (
                  <a
                    href={providersHrefForCategory(g.category, g.secondary)}
                    className="mt-2 inline-block text-xs font-bold text-amber-600 underline-offset-2 hover:underline"
                  >
                    פתח חיפוש ב־{g.category} →
                  </a>
                ) : null}
                {v === true && !g.category ? (
                  <a
                    href="/providers"
                    className="mt-2 inline-block text-xs font-bold text-amber-600 underline-offset-2 hover:underline"
                  >
                    פתח את מאגר שירותי הספקים →
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
        {interestedGaps.length > 0 ? (
          <p className="mt-4 text-xs text-neutral-600">
            סימנתם עניין ב־{interestedGaps.length} קטגוריות — אפשר להמשיך לשלוח בקשות ישירות
            מהדפים של הספקים.
          </p>
        ) : null}
      </section>

      <footer className="flex flex-col gap-3 border-t border-neutral-200 pt-6 text-sm">
        <a
          href={`/halls/${venueId}`}
          className="inline-flex items-center justify-center rounded-2xl border-2 border-emerald-950/25 bg-white px-4 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-50"
        >
          חזרה לדף האולם
        </a>
        <a
          href={`/halls/${venueId}/inquiry`}
          className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 font-bold text-white shadow transition hover:bg-amber-300"
        >
          המשך לשליחת בקשה לאולם
        </a>
        <p className="text-center text-[11px] text-neutral-600">
          לא רוצים את המסלול הזה? פשוט סגרו את הדף או חזרו לאולם — אין שמירה בשרת בשלב זה.
        </p>
      </footer>
    </div>
  );
}
