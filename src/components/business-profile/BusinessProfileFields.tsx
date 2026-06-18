"use client";

import IsraeliMobilePhoneInput from "@/components/IsraeliMobilePhoneInput";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import {
  BUSINESS_PROFILE_PUBLIC_HINTS,
  type BusinessProfileRole,
  type BusinessProfileValues,
} from "@/lib/businessProfile";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";
import type { SocialLink } from "@/lib/socialLinks";

type Props = {
  role: BusinessProfileRole;
  email: string;
  mode: "onboarding" | "edit";
  values: BusinessProfileValues;
  onChange: (patch: Partial<BusinessProfileValues>) => void;
  socialLinks?: SocialLink[];
  onSocialLinksChange?: (links: SocialLink[]) => void;
};

const input =
  "mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40";
const inputReadOnly =
  "mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-600";
const mobileSelect =
  "shrink-0 rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40";
const mobileRest =
  "min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40";
const sectionClass =
  "space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,59,46,0.06)]";
const sectionTitle = "text-sm font-semibold text-emerald-950";
const labelClass = "block text-sm font-medium text-neutral-700";
const hintClass = "mt-1 text-xs leading-relaxed text-neutral-600";

function RequiredMark({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="mr-1 text-red-600">*</span>;
}

export default function BusinessProfileFields({
  role,
  email,
  mode,
  values,
  onChange,
  socialLinks,
  onSocialLinksChange,
}: Props) {
  const hints = BUSINESS_PROFILE_PUBLIC_HINTS[role];
  const isOnboarding = mode === "onboarding";
  const businessNameLabel =
    role === "venue-owner" ? "שם העסק / המותג" : "שם העסק / המותג (שם הספק)";

  return (
    <div className="space-y-5 text-right">
      <section className={sectionClass}>
        <h2 className={sectionTitle}>פרטי חשבון</h2>
        <p className="text-xs leading-relaxed text-neutral-600">
          לשימוש פנימי, התחברות והתראות — לא מוצגים ישירות למחפשים.
        </p>

        <div>
          <label className={labelClass}>אימייל (התחברות)</label>
          <input
            type="email"
            value={email}
            readOnly
            disabled
            className={inputReadOnly}
          />
        </div>

        <div>
          <label className={labelClass}>שם איש קשר</label>
          <input
            type="text"
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={input}
            placeholder="השם שלך בניהול המערכת"
          />
          <p className={hintClass}>לא מוצג בדף האולם או בעמוד הספק.</p>
        </div>

        <div>
          <label className={labelClass}>
            <RequiredMark show={isOnboarding} />
            טלפון אישי (נייד)
          </label>
          <IsraeliMobilePhoneInput
            value={values.phone}
            onChange={(phone) => onChange({ phone })}
            forceMobile
            selectClassName={mobileSelect}
            inputClassName={mobileRest}
          />
          <p className={hintClass}>
            בחרו קידומת והזינו 7 ספרות (סה״כ 10 ספרות כולל 0). משמש גיבוי ליצירת
            קשר אם לא הוזן טלפון עסקי.
          </p>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitle}>מה שמחפשים רואים</h2>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
          {role === "venue-owner" ? (
            <>
              שם העסק והטלפון העסקי מוצגים בדף האולם ובפניות. לכל אולם יש כתובת
              ופרטים נפרדים ביצירת האולם.
            </>
          ) : (
            <>
              שם המותג מופיע בחיפוש ובכרטיסי שירות. טלפון, כתובת ורשתות חברתיות
              מוצגים בעמוד הספק ובשירותים.
            </>
          )}
        </div>

        <div>
          <label className={labelClass}>
            <RequiredMark show={isOnboarding} />
            {businessNameLabel}
          </label>
          <input
            type="text"
            value={values.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            className={input}
            placeholder={
              role === "venue-owner"
                ? "לדוגמה: אולמות האירועים של דוד"
                : "למשל: סטודיו צילום XYZ"
            }
          />
          <p className={hintClass}>{hints.businessName}</p>
        </div>

        <div>
          <label className={labelClass}>
            <RequiredMark show={isOnboarding && role === "venue-owner"} />
            טלפון עסקי
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={values.businessPhone}
            onChange={(e) =>
              onChange({ businessPhone: normalizePhoneInput(e.target.value) })
            }
            className={input}
            placeholder="03-xxxxxxx או 05xxxxxxxx"
          />
          <p className={hintClass}>{hints.businessPhone}</p>
        </div>

        <div>
          <label className={labelClass}>כתובת / אזור (כללי)</label>
          <input
            type="text"
            value={values.businessAddress}
            onChange={(e) => onChange({ businessAddress: e.target.value })}
            className={input}
            placeholder={
              role === "venue-owner"
                ? "עיר, רחוב (בלי מספר אולם ספציפי)"
                : "עיר, אזור שירות"
            }
          />
          <p className={hintClass}>{hints.businessAddress}</p>
        </div>
      </section>

      {role === "freelancer" && socialLinks != null && onSocialLinksChange ? (
        <section className={sectionClass}>
          <SocialLinksEditor
            value={socialLinks}
            onChange={onSocialLinksChange}
            title="רשתות חברתיות וקישורים"
            description="מוצגים בעמוד הספק הציבורי — אייקון הרשת וקישור ללחיצה."
            addButtonText="+ הוסף רשת / קישור"
          />
        </section>
      ) : null}
    </div>
  );
}
