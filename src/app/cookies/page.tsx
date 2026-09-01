import SitePageShell from "@/components/layout/SitePageShell";
import SiteLegalNotice from "@/components/layout/SiteLegalNotice";
import CookieSettingsLink from "@/components/consent/CookieSettingsLink";
import Link from "next/link";
import { LEGAL_LAST_UPDATED_HE } from "@/lib/legal/constants";
import { getLegalPlaceholders, getSiteLegalInfo } from "@/lib/siteLegal";

export default async function CookiesPage() {
  const legal = getSiteLegalInfo();
  const p = getLegalPlaceholders();

  return (
    <SitePageShell mainWidth="legal">
      {/* טיוטה משפטית — לאישור עו״ד לפני פרסום סופי */}
      <h1 className="site-page-title">מדיניות עוגיות</h1>
      <p className="mt-2 text-xs text-neutral-600">עודכן: {LEGAL_LAST_UPDATED_HE}</p>
      <SiteLegalNotice show={legal.isPlaceholder} />

      <div className="site-card-padded prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-neutral-800">
        <p>
          אתר EventForYou («אנחנו», «האתר») משתמש בעוגיות ובאחסון מקומי בדפדפן (localStorage)
          כדי להפעיל את השירות, לשמור העדפות ולמדוד שימוש. מסמך זה מסביר מה נאסף וכיצד לנהל
          את ההסכמה, בקשר ל
          <Link href="/privacy" className="font-medium text-emerald-950 underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>

        <h2 className="text-base font-semibold text-emerald-950">מהן עוגיות?</h2>
        <p>
          עוגיות הן קבצי טקסט קטנים שנשמרים בדפדפן. אנו גם משתמשים באחסון מקומי דומה לשמירת
          חיפושים, רשימות וערכת תצוגה — מטופל באותה קטגוריית «העדפות ונוחות».
        </p>

        <h2 className="text-base font-semibold text-emerald-950">קטגוריות</h2>
        <ul className="list-disc space-y-2 pr-5">
          <li>
            <strong>חיוניות</strong> — עוגיית התחברות (session), אימות אימייל ממתין, אבטחה
            והפעלת האתר. לא ניתן לכבות.
          </li>
          <li>
            <strong>העדפות ונוחות</strong> — שמירת סינוני חיפוש, רשימת תכנון אירוע, אולמות
            וספקים שנצפו לאחרונה, ערכת צבעים, העדפות נגישות.
          </li>
          <li>
            <strong>מדידה ושיפור</strong> — מדידת צפייה מעורבת (למשל 30 שניות בעמוד אולם או
            פרופיל ספק) ודיווח שגיאות טכני דרך Sentry כשהשירות מופעל — רק לאחר הסכמתכם
            בקטגוריה זו.
          </li>
        </ul>

        <h2 className="text-base font-semibold text-emerald-950">ניהול הסכמה</h2>
        <p>
          בביקור ראשון מוצג באנר עם אפשרויות «קבלת הכל», «דחיית הכל» ו«ניהול העדפות». קטגוריות
          שאינן חיוניות כבויות כברירת מחדל עד שתבחרו במפורש. ניתן לשנות את הבחירה בכל עת דרך{" "}
          <CookieSettingsLink /> בתחתית האתר, או בדף{" "}
          <Link href="/settings/privacy" className="font-medium text-emerald-950 underline">
            הגדרות
          </Link>
          .
        </p>

        <h2 className="text-base font-semibold text-emerald-950">משך שמירה</h2>
        <p>
          עוגיית התחברות נשמרת לפי הגדרות הדפדפן והשרת. העדפות עוגיות נשמרות ב-localStorage עד
          שתמחקו אותן או תשנו את הבחירה. נתוני מדידה בשרת נשמרים לפי מדיניות הפרטיות.
        </p>

        <h2 className="text-base font-semibold text-emerald-950">צדדים שלישיים</h2>
        <p>
          שירותי צד שלישי (למשל Sentry לדיווח שגיאות) עשויים להציב עוגיות או לעבד מידע טכני
          רק כאשר קטגוריית המדידה מופעלת בהסכמתכם. פרטים נוספים ב
          <Link href="/privacy" className="font-medium text-emerald-950 underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>

        <p>
          לשאלות:{" "}
          <a href={`mailto:${p.privacyEmail}`} className="text-emerald-950 underline">
            {p.privacyEmail}
          </a>
          {" "}או{" "}
          <Link href="/contact" className="text-emerald-950 underline">
            טופס יצירת קשר
          </Link>
          .
        </p>
      </div>

      <p className="mt-10 text-xs">
        <Link href="/privacy" className="font-medium text-emerald-950 underline">
          מדיניות פרטיות
        </Link>
        {" · "}
        <Link href="/terms" className="font-medium text-emerald-950 underline">
          תנאי שימוש
        </Link>
        {" · "}
        <Link href="/accessibility" className="font-medium text-emerald-950 underline">
          נגישות
        </Link>
        {" · "}
        <Link href="/" className="text-neutral-600 underline">
          דף הבית
        </Link>
      </p>
    </SitePageShell>
  );
}
