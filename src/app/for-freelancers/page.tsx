import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import SitePageHeader from "@/components/layout/SitePageHeader";
import { SITE_BRAND } from "@/lib/siteBrand";

export const metadata: Metadata = {
  title: `הצטרפות לספקים | ${SITE_BRAND}`,
  description:
    "פרסום בסיסי חינם לספקי שירותים לאירועים. עמלה 10% רק על עסקה שנסגרה דרך האתר — לא על לידים. בלי כרטיס אשראי. הרשמה בשני שלבים.",
  alternates: { canonical: "/for-freelancers" },
};

const WHY = [
  {
    title: "חשיפה למחפשים אמיתיים",
    text: "מחפשים מגיעים אליכם עם תאריך, תקציב וסוג אירוע — לא רק «תתקשרו אליי».",
  },
  {
    title: "פרסום בסיסי חינם",
    text: "יצירת פרופיל ושירותים בסיסיים ללא עלות חודשית וללא כרטיס אשראי.",
  },
  {
    title: "עמלה רק על עסקה שנסגרה",
    text: "10% רק כשנסגרת עסקה דרך הפלטפורמה. פניות ולידים שלא נסגרו — בלי עמלה.",
  },
] as const;

const HOW = [
  "נרשמים כספק (שלב 1) וממלאים פרופיל עסקי (שלב 2).",
  "מוסיפים שירות אחד או יותר עם מחיר וקטגוריה.",
  "מחפשים שולחים בקשה — אתם עונים, מתמקחים ומסכמים.",
  "כשנסגרת עסקה דרך האתר — חלה עמלת פלטפורמה של 10%.",
] as const;

const FAQ = [
  {
    q: "כמה זה עולה?",
    a: "הפרסום הבסיסי חינם. אין דמי מנוי ואין צורך בכרטיס אשראי. עמלה של 10% רק על עסקה שנסגרה דרך האתר.",
  },
  {
    q: "משלמים על כל פנייה?",
    a: "לא. פניות ולידים שלא הפכו לעסקה — בלי עמלה.",
  },
  {
    q: "מה כולל תהליך ההרשמה?",
    a: "שני שלבים: יצירת חשבון, ואז השלמת פרופיל עסקי (שם עסק, טלפון וכו'). אחר כך מוסיפים שירותים.",
  },
  {
    q: "צריך לאמת מייל?",
    a: "כשאימות מייל מופעל באתר — תתבקשו לאמת אחרי ההרשמה. גם לפני האימות אפשר להתחיל לבנות שירותים.",
  },
] as const;

const REGISTER_HREF = "/auth/register/business?role=FREELANCER";

export default function ForFreelancersPage() {
  return (
    <SitePageShell mainWidth="wide">
      <SitePageHeader
        title="ספקי שירותים — הצטרפו ל־EventForYou"
        description="פרסום בסיסי חינם. עמלה 10% רק על עסקה שנסגרה. בלי כרטיס אשראי."
      />

      <div className="mt-8 grid gap-10 text-right lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-emerald-950">למה להצטרף</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {WHY.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm"
                >
                  <h3 className="font-semibold text-emerald-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-emerald-950">איך זה עובד</h2>
            <ol className="space-y-2 text-sm text-neutral-700">
              {HOW.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-emerald-950">שאלות נפוצות</h2>
            <dl className="space-y-3">
              {FAQ.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-3"
                >
                  <dt className="font-semibold text-emerald-950">{item.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50 to-white p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-amber-800">
              הרשמה בשני שלבים
            </p>
            <h2 className="mt-1 text-xl font-bold text-emerald-950">
              הצטרפו כספק ראשונים
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
              <li>✓ פרסום בסיסי חינם</li>
              <li>✓ 10% רק על עסקה שנסגרה — לא על לידים</li>
              <li>✓ בלי כרטיס אשראי</li>
            </ul>
            <Link
              href={REGISTER_HREF}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-amber-400 px-5 text-sm font-bold text-neutral-950 shadow-md transition hover:bg-amber-300"
            >
              הרשמה כספק שירותים
            </Link>
            <p className="mt-3 text-center text-xs text-neutral-500">
              בעלי אולמות?{" "}
              <Link
                href="/for-venues"
                className="font-semibold text-emerald-950 underline-offset-2 hover:underline"
              >
                דף לבעלי אולמות
              </Link>
            </p>
          </div>
          <p className="text-center text-xs text-neutral-500">
            כבר יש חשבון?{" "}
            <Link href="/auth/login" className="font-semibold text-emerald-950 hover:underline">
              התחברות
            </Link>
          </p>
        </aside>
      </div>
    </SitePageShell>
  );
}
