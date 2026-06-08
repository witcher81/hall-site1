import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import Link from "next/link";

export default async function PrivacyPage() {
  return (
    <SitePageShell mainWidth="legal">
      <h1 className="site-page-title">מדיניות פרטיות</h1>
      <p className="mt-2 text-xs text-neutral-600">עודכן: מאי 2026</p>

      <div className="site-card-padded prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-neutral-800">
        <p>
          אנו מכבדים את פרטיותכם. מסמך זה מתאר אילו נתונים נאספים בעת שימוש ב-Halls Hub וכיצד
          הם משמשים.
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
        <h2 className="text-base font-semibold text-emerald-950">שיתוף עם צדדים שלישיים</h2>
        <p>
          אנו משתמשים בספקי תשתית (אירוח, מסד נתונים, דואר אלקטרוני) לפי הצורך להפעלת האתר.
          לא מוכרים את פרטיכם האישיים לצדדים שלישיים לשיווק.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">זכויותיכם</h2>
        <p>
          ניתן לעדכן פרטים בדף ההגדרות, לנהל עוגיות, ולמחוק חשבון באופן עצמי (דורש אימות
          סיסמה). עוגיות התחברות נדרשות לשימוש בחשבון מחובר.
        </p>
        <p>
          יצירת קשר:{" "}
          <a href="mailto:privacy@hallshub.example" className="text-emerald-950 underline">
            privacy@hallshub.example
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
        <Link href="/" className="text-neutral-600 underline">
          דף הבית
        </Link>
      </p>
      <SiteFooter />
    </SitePageShell>
  );
}
