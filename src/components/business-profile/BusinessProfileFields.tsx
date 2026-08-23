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
import { useId, useRef, useState } from "react";

type Props = {
  role: BusinessProfileRole;
  email: string;
  mode: "onboarding" | "edit";
  values: BusinessProfileValues;
  onChange: (patch: Partial<BusinessProfileValues>) => void;
  socialLinks?: SocialLink[];
  onSocialLinksChange?: (links: SocialLink[]) => void;
  /** קובץ תמונת פרופיל שנבחר (עדיין לא הועלה) */
  profileImageFile?: File | null;
  onProfileImageFileChange?: (file: File | null) => void;
  clearProfileImage?: boolean;
  onClearProfileImageChange?: (clear: boolean) => void;
};

const input = "site-input mt-1 py-2.5";
const inputReadOnly =
  "site-input mt-1 cursor-not-allowed bg-[var(--card-muted)] py-2.5 text-[var(--muted)] opacity-90";
const mobileSelect = "site-input shrink-0 w-auto py-2.5 px-2";
const mobileRest = "site-input min-w-0 flex-1 py-2.5";
const sectionClass =
  "space-y-4 rounded-2xl border-2 border-[var(--border-soft)] bg-[var(--card)] p-5 shadow-[0_8px_28px_rgba(15,59,46,0.1)]";
const sectionTitle = "text-sm font-semibold text-[var(--heading)]";
const labelClass = "block text-sm font-medium text-[var(--foreground)]";
const hintClass = "mt-1 text-xs leading-relaxed text-[var(--muted)]";

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
  profileImageFile,
  onProfileImageFileChange,
  clearProfileImage,
  onClearProfileImageChange,
}: Props) {
  const hints = BUSINESS_PROFILE_PUBLIC_HINTS[role];
  const isOnboarding = mode === "onboarding";
  const businessNameLabel =
    role === "venue-owner" ? "שם העסק / המותג" : "שם העסק / המותג (שם הספק)";
  const bioId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayImage =
    previewUrl ||
    (!clearProfileImage && values.profileImageUrl
      ? values.profileImageUrl
      : null);

  function handleFilePick(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      onClearProfileImageChange?.(false);
    } else {
      setPreviewUrl(null);
    }
    onProfileImageFileChange?.(file);
  }

  return (
    <div className="space-y-5 text-right">
      <section className={sectionClass}>
        <h2 className={sectionTitle}>פרטי חשבון</h2>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          לשימוש פנימי, התחברות והתראות — לא מוצגים ישירות למחפשים.
        </p>

        <div>
          <label htmlFor="biz-email" className={labelClass}>
            אימייל (התחברות)
          </label>
          <input
            id="biz-email"
            type="email"
            value={email}
            readOnly
            disabled
            className={inputReadOnly}
          />
        </div>

        <div>
          <label htmlFor="biz-contact-name" className={labelClass}>
            שם איש קשר
          </label>
          <input
            id="biz-contact-name"
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
          {values.phone.trim() && !isValidIsraeliPhone(values.phone) ? (
            <p className="mt-1 text-xs text-red-700">מספר לא תקין</p>
          ) : null}
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitle}>מה שמחפשים רואים</h2>
        <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--card-muted)] px-3 py-2.5 text-xs leading-relaxed text-[var(--foreground)]">
          {role === "venue-owner" ? (
            <>
              שם העסק והטלפון העסקי מוצגים בדף האולם ובפניות. לכל אולם יש כתובת
              ופרטים נפרדים ביצירת האולם.
            </>
          ) : (
            <>
              שם המותג, תמונת פרופיל ותיאור קצר מופיעים בעמוד הספק. טלפון, כתובת
              ורשתות חברתיות מוצגים גם שם ובשירותים.
            </>
          )}
        </div>

        {role === "freelancer" && onProfileImageFileChange ? (
          <div>
            <p className={labelClass}>תמונת פרופיל / לוגו</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-50">
                {displayImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayImage}
                    alt="תצוגה מקדימה של תמונת הפרופיל"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-neutral-400" aria-hidden>
                    ✦
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    handleFilePick(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-neutral-50"
                >
                  {displayImage ? "החלפת תמונה" : "העלאת תמונה"}
                </button>
                {displayImage || values.profileImageUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleFilePick(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      onClearProfileImageChange?.(true);
                    }}
                    className="mr-2 text-xs font-medium text-red-700 underline"
                  >
                    הסרת תמונה
                  </button>
                ) : null}
                {profileImageFile ? (
                  <p className="text-[11px] text-neutral-600">
                    נבחר: {profileImageFile.name}
                  </p>
                ) : null}
                <p className={hintClass}>{hints.profileImage}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="biz-name" className={labelClass}>
            <RequiredMark show={isOnboarding} />
            {businessNameLabel}
          </label>
          <input
            id="biz-name"
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

        {role === "freelancer" ? (
          <div>
            <label htmlFor={bioId} className={labelClass}>
              על העסק / עליי (תיאור קצר)
            </label>
            <textarea
              id={bioId}
              value={values.businessBio}
              onChange={(e) => onChange({ businessBio: e.target.value })}
              rows={4}
              maxLength={800}
              className={input}
              placeholder="למשל: צלמי חתונות עם ניסיון של 10 שנים באזור המרכז. מתמחים בצילום טבעי ורגעי."
            />
            <p className={hintClass}>{hints.businessBio}</p>
          </div>
        ) : null}

        <div>
          <label htmlFor="biz-phone" className={labelClass}>
            <RequiredMark show={isOnboarding && role === "venue-owner"} />
            טלפון עסקי
          </label>
          <input
            id="biz-phone"
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
          <label htmlFor="biz-address" className={labelClass}>
            כתובת / אזור (כללי)
          </label>
          <input
            id="biz-address"
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
