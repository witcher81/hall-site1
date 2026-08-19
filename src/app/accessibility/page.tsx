import SitePageShell from "@/components/layout/SitePageShell";
import Link from "next/link";
import SiteLegalNotice from "@/components/layout/SiteLegalNotice";
import { getSiteLegalInfo } from "@/lib/siteLegal";

export default async function AccessibilityPage() {
  const legal = getSiteLegalInfo();
  return (
    <SitePageShell mainWidth="legal">
      <h1 className="site-page-title">הצהרת נגישות</h1>
      <p className="mt-2 text-xs text-neutral-600">עודכן: אוגוסט 2026</p>
      <SiteLegalNotice show={legal.isPlaceholder} />

      <div className="site-card-padded prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-neutral-800">
        <p>
          EventForYou מחויב להנגיש את השירותים הדיגיטליים שלו לכלל המשתמשים, כולל אנשים עם
          מוגבלות. אנו פועלים להתאמת האתר לדרישות תקן ישראלי 5568 (מבוסס על WCAG 2.0) ברמת
          AA, ככל שניתן במסגרת המערכת הקיימת.
        </p>

        <h2 className="text-base font-semibold text-emerald-950">מידע כללי על האתר</h2>
        <ul className="list-disc space-y-1 pr-5">
          <li>שפת האתר: עברית, כיוון כתיבה מימין לשמאל (RTL)</li>
          <li>האתר מיועד לחיפוש אולמות, ספקי אירועים, פניות והתכתבות</li>
          <li>ניתן להשתמש באתר בדפדפנים מודרניים (Chrome, Firefox, Safari, Edge)</li>
        </ul>

        <h2 className="text-base font-semibold text-emerald-950">התאמות שבוצעו</h2>
        <ul className="list-disc space-y-1 pr-5">
          <li>מבנה סמנטי של כותרות ואזורי תוכן עיקריים</li>
          <li>ניווט מקלדת בטפסים, כפתורים וקישורים</li>
          <li>תוויות (labels) לשדות טפסים מרכזיים</li>
          <li>ניגודיות צבעים בהתאם לשפת העיצוב של האתר</li>
          <li>תמיכה בכיוון RTL לקריאה בעברית</li>
          <li>טקסט חלופי לתמונות במקומות שבהם הוגדר</li>
          <li>
            כפתור נגישות צף בכל העמודים — הגדלת טקסט, ניגודיות גבוהה, הדגשת קישורים,
            עצירת אנימציות ועוד
          </li>
          <li>קישור «דלג לתוכן הראשי» למשתמשי מקלדת</li>
        </ul>

        <h2 className="text-base font-semibold text-emerald-950">כפתור הנגישות</h2>
        <p>
          בפינה השמאלית־תחתונה של המסך מופיע כפתור נגישות. לחיצה עליו פותחת תפריט
          התאמות תצוגה שנשמרות בדפדפן שלכם. ניתן לאפס בכל רגע דרך «איפוס הגדרות».
        </p>

        <h2 className="text-base font-semibold text-emerald-950">מגבלות ידועות</h2>
        <p>
          חלק מהתוכן מוזן על ידי משתמשים (תמונות אולמות, תיאורי שירותים) — איכות התיאורים
          והנגישות של תוכן זה תלויה במפרסמים. ייתכן שחלק מרכיבי צד שלישי (מפות, וידג&apos;טים
          חיצוניים) אינם נגישים במלואם. אנו ממשיכים לשפר את האתר בהדרגה.
        </p>

        <h2 className="text-base font-semibold text-emerald-950">הגדלת תצוגה ועזרים בדפדפן</h2>
        <p>
          ניתן להגדיל טקסט באמצעות Ctrl + גלגלת העכבר או Ctrl + &quot;+&quot; / Cmd + &quot;+&quot;.
          מומלץ להפעיל קורא מסך מובנה במערכת ההפעלה או תוסף נגישות בדפדפן לפי הצורך.
        </p>

        <h2 className="text-base font-semibold text-emerald-950">בקשות, משוב ורכז נגישות</h2>
        <p>
          נתקלתם בבעיית נגישות? נשמח לסייע. פנו אלינו וציינו את כתובת העמוד והבעיה:
        </p>
        <p>
          דוא״ל:{" "}
          {legal.accessibilityEmail ? (
            <a href={`mailto:${legal.accessibilityEmail}`} className="text-emerald-950 underline">
              {legal.accessibilityEmail}
            </a>
          ) : (
            <Link href="/contact" className="text-emerald-950 underline">
              טופס יצירת קשר
            </Link>
          )}
          <br />
          נושא מומלץ: «נגישות — EventForYou»
        </p>
        <p>
          נשתדל להשיב בתוך 14 ימי עסקים ולטפל בפניות בהתאם לחוק שוויון זכויות לאנשים עם
          מוגבלות, התשנ״ח-1998.
        </p>

        <h2 className="text-base font-semibold text-emerald-950">מסמכים קשורים</h2>
        <p>
          <Link href="/privacy" className="font-medium text-emerald-950 underline">
            מדיניות פרטיות
          </Link>
          {" · "}
          <Link href="/terms" className="font-medium text-emerald-950 underline">
            תנאי שימוש
          </Link>
          {" · "}
          <Link href="/cookies" className="font-medium text-emerald-950 underline">
            עוגיות
          </Link>
        </p>
      </div>

      <p className="mt-10 text-xs">
        <Link href="/" className="text-neutral-600 underline">
          דף הבית
        </Link>
      </p>
    </SitePageShell>
  );
}
