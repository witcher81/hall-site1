import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import Link from "next/link";

export default async function TermsPage() {
  return (
    <SitePageShell mainWidth="legal">
      <h1 className="site-page-title">תנאי שימוש</h1>
      <p className="mt-2 text-xs text-neutral-600">עודכן: מאי 2026</p>

      <div className="site-card-padded prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-neutral-800">
        <p>
          ברוכים הבאים ל-Halls Hub. השימוש באתר מהווה הסכמה לתנאים אלה. האתר מספק פלטפורמה
          לחיבור בין מחפשי אולמות, בעלי אולמות וספקי שירותים לאירועים — איננו צד לחוזה בין
          המשתמשים.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">הרשמה וחשבון</h2>
        <p>
          אתם אחראים לדיוק הפרטים שמסרתם ולשמירה על סודיות הסיסמה. אסור להשתמש בחשבון
          למטרות מטעות, הונאה או פגיעה במשתמשים אחרים.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">תוכן ופרסומים</h2>
        <p>
          בעלי אולמות וספקים אחראים לתוכן שמפרסמים (תמונות, מחירים, זמינות). אנו רשאים
          להסיר תוכן שמפר תנאים אלה או את החוק.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">פניות והזמנות</h2>
        <p>
          שליחת פנייה או בקשה דרך האתר אינה מהווה הזמנה מחייבת. כל הסדר מול אולם או ספק
          נעשה ישירות ביניכם.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">הגבלת אחריות</h2>
        <p>
          האתר מסופק «כמות שהוא». לא נהיה אחראים לנזק עקיף או לתוצאות של בחירת אולם/ספק,
          למעט ככל שהדין מחייב אחרת.
        </p>
        <p>
          שאלות:{" "}
          <a href="mailto:support@hallshub.example" className="text-emerald-950 underline">
            support@hallshub.example
          </a>
        </p>
      </div>

      <p className="mt-10 text-xs">
        <Link href="/privacy" className="font-medium text-emerald-950 underline">
          מדיניות פרטיות
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
