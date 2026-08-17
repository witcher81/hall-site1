import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteLegalNotice from "@/components/layout/SiteLegalNotice";
import Link from "next/link";
import { getSiteLegalInfo } from "@/lib/siteLegal";

export default async function PrivacyPage() {
  const legal = getSiteLegalInfo();
  return (
    <SitePageShell mainWidth="legal">
      <h1 className="site-page-title">מדיניות פרטיות</h1>
      <p className="mt-2 text-xs text-neutral-600">עודכן: אוגוסט 2026</p>
      <SiteLegalNotice show={legal.isPlaceholder} />

      <div className="site-card-padded prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-neutral-800">
        <p>
          אנו מכבדים את פרטיותכם. מסמך זה מתאר אילו נתונים נאספים בעת שימוש ב-{legal.legalName}{" "}
          וכיצד הם משמשים.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">נתונים שנאספים</h2>
        <ul className="list-disc space-y-1 pr-5">
          <li>פרטי הרשמה (שם, אימייל, תפקיד במערכת)</li>
          <li>תוכן שמפרסמים (אולמות, שירותים, הודעות, פניות)</li>
          <li>נתוני שימוש טכניים (עוגיות התחברות, מדדי צפייה מעורבת בעמודים)</li>
        </ul>
        <h2 className="text-base font-semibold text-emerald-950">שימוש במידע</h2>
        <p>
          להפעלת החשבון, הצגת תוצאות חיפוש, התראות, מניעת שימוש לרעה (כולל הגבלת קצב בקשות),
          ושיפור השירות.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">שיתוף מידע וספקי שירות</h2>
        <p>
          פרטים שמוזנים בפנייה או בבקשה מועברים לצד השני הרלוונטי בלבד — למשל לבעל האולם או
          לספק שאליו פניתם. אנו עשויים להיעזר בספקי תשתית לצורך אחסון, מסד נתונים, שליחת דוא״ל,
          מניעת שימוש לרעה, מדידת שימוש ודיווח שגיאות; הם מקבלים רק מידע הנחוץ להפעלת השירות.
          איננו מוכרים מידע אישי.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">שמירה ומחיקה</h2>
        <p>
          מידע בחשבון נשמר כל עוד החשבון פעיל או כל עוד הוא נדרש לצורך מתן השירות, אבטחה,
          טיפול במחלוקות ועמידה בחובות לפי דין. אפשר לבקש מחיקה, עיון או תיקון באמצעות טופס
          הפרטיות; חלק מהמידע עשוי להישמר לתקופה מוגבלת אם הדין מחייב זאת.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">זכויותיכם (תיקון 13)</h2>
        <p>
          ניתן לעדכן פרטים בדף ההגדרות, לנהל עוגיות, ולמחוק חשבון באופן עצמי (דורש אימות
          סיסמה). לבקשת עיון, תיקון או מחיקת מידע —{" "}
          <Link href="/privacy/request" className="font-medium text-emerald-950 underline">
            טופס בקשה לפי תיקון 13
          </Link>
          .
        </p>
        <p>
          יצירת קשר:{" "}
          <a href={`mailto:${legal.privacyEmail}`} className="text-emerald-950 underline">
            {legal.privacyEmail}
          </a>
        </p>
      </div>

      <p className="mt-10 text-xs">
        <Link href="/terms" className="font-medium text-emerald-950 underline">
          תנאי שימוש
        </Link>
        {" · "}
        <Link href="/cookies" className="font-medium text-emerald-950 underline">
          עוגיות
        </Link>
        {" · "}
        <Link href="/accessibility" className="font-medium text-emerald-950 underline">
          נגישות
        </Link>
        {" · "}
        <Link href="/contact" className="font-medium text-emerald-950 underline">
          יצירת קשר
        </Link>
      </p>
      <SiteFooter />
    </SitePageShell>
  );
}
