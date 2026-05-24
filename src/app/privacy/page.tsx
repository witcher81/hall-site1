import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import HomeHeader from "@/components/HomeHeader";
import Link from "next/link";

export default async function PrivacyPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-3xl px-4 py-10 text-right sm:px-6">
        <h1 className="text-2xl font-bold text-[#0F3B2E]">מדיניות פרטיות</h1>
        <p className="mt-2 text-xs text-[#6B6560]">עודכן: מאי 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-[#2A261F]">
          <p>
            אנו מכבדים את פרטיותכם. מסמך זה מתאר אילו נתונים נאספים בעת שימוש ב-Halls Hub
            וכיצד הם משמשים.
          </p>
          <h2 className="text-base font-semibold text-[#0F3B2E]">נתונים שנאספים</h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>פרטי הרשמה (שם, אימייל, תפקיד במערכת)</li>
            <li>תוכן שמפרסמים (אולמות, שירותים, הודעות, פניות)</li>
            <li>נתוני שימוש טכניים (עוגיות התחברות, מדדי צפייה מעורבת בעמודים)</li>
          </ul>
          <h2 className="text-base font-semibold text-[#0F3B2E]">שימוש במידע</h2>
          <p>
            להפעלת החשבון, הצגת תוצאות חיפוש, התראות, מניעת שימוש לרעה (כולל הגבלת קצב
            בקשות), ושיפור השירות.
          </p>
          <h2 className="text-base font-semibold text-[#0F3B2E]">שיתוף עם צדדים שלישיים</h2>
          <p>
            אנו משתמשים בספקי תשתית (אירוח, מסד נתונים, דואר אלקטרוני) לפי הצורך להפעלת
            האתר. לא מוכרים את פרטיכם האישיים לצדדים שלישיים לשיווק.
          </p>
          <h2 className="text-base font-semibold text-[#0F3B2E]">זכויותיכם</h2>
          <p>
            ניתן לבקש עדכון או מחיקת חשבון בפנייה אלינו. עוגיות התחברות נדרשות לשימוש
            בחשבון מחובר.
          </p>
          <p>
            יצירת קשר:{" "}
            <a href="mailto:privacy@hallshub.example" className="text-[#0F3B2E] underline">
              privacy@hallshub.example
            </a>
          </p>
        </div>

        <p className="mt-10 text-xs">
          <Link href="/terms" className="font-medium text-[#0F3B2E] underline">
            תנאי שימוש
          </Link>
          {" · "}
          <Link href="/" className="text-[#6B6560] underline">
            דף הבית
          </Link>
        </p>
      </main>
    </div>
  );
}
