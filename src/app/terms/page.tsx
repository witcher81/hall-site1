import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import HomeHeader from "@/components/HomeHeader";
import Link from "next/link";

export default async function TermsPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-3xl px-4 py-10 text-right sm:px-6">
        <h1 className="text-2xl font-bold text-[#0F3B2E]">תנאי שימוש</h1>
        <p className="mt-2 text-xs text-[#6B6560]">עודכן: מאי 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-[#2A261F]">
          <p>
            ברוכים הבאים ל-Halls Hub. השימוש באתר מהווה הסכמה לתנאים אלה. האתר מספק
            פלטפורמה לחיבור בין מחפשי אולמות, בעלי אולמות וספקי שירותים לאירועים — איננו
            צד לחוזה בין המשתמשים.
          </p>
          <h2 className="text-base font-semibold text-[#0F3B2E]">הרשמה וחשבון</h2>
          <p>
            אתם אחראים לדיוק הפרטים שמסרתם ולשמירה על סודיות הסיסמה. אסור להשתמש בחשבון
            למטרות מטעות, הונאה או פגיעה במשתמשים אחרים.
          </p>
          <h2 className="text-base font-semibold text-[#0F3B2E]">תוכן ופרסומים</h2>
          <p>
            בעלי אולמות וספקים אחראים לתוכן שמפרסמים (תמונות, מחירים, זמינות). אנו רשאים
            להסיר תוכן שמפר תנאים אלה או את החוק.
          </p>
          <h2 className="text-base font-semibold text-[#0F3B2E]">פניות והזמנות</h2>
          <p>
            שליחת פנייה או בקשה דרך האתר אינה מהווה הזמנה מחייבת. כל הסדר מול אולם או ספק
            נעשה ישירות ביניכם.
          </p>
          <h2 className="text-base font-semibold text-[#0F3B2E]">הגבלת אחריות</h2>
          <p>
            האתר מסופק «כמות שהוא». לא נהיה אחראים לנזק עקיף או לתוצאות של בחירת אולם/ספק,
            למעט ככל שהדין מחייב אחרת.
          </p>
          <p>
            שאלות:{" "}
            <a href="mailto:support@hallshub.example" className="text-[#0F3B2E] underline">
              support@hallshub.example
            </a>
          </p>
        </div>

        <p className="mt-10 text-xs">
          <Link href="/privacy" className="font-medium text-[#0F3B2E] underline">
            מדיניות פרטיות
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
