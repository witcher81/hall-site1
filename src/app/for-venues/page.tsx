import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import SitePageHeader from "@/components/layout/SitePageHeader";
import { SITE_BRAND } from "@/lib/siteBrand";

export const metadata: Metadata = {
  title: `הצטרפות לבעלי אולמות | ${SITE_BRAND}`,
  description:
    "פרסום בסיסי חינם לבעלי אולמות אירועים. עמלה 10% רק על עסקה שנסגרה דרך האתר — לא על לידים. בלי כרטיס אשראי.",
  alternates: { canonical: "/for-venues" },
};

const WHY = [
  {
    title: "פניות עם הקשר",
    text: "מחפשים מגיעים עם תאריך, מספר אורחים וסוג אירוע — פחות שיחות סתמיות.",
  },
  {
    title: "פרסום בסיסי חינם",
    text: "פרופיל אולם עם גלריה, מחירים וזמינות — בלי דמי מנוי ובלי כרטיס אשראי.",
  },
  {
    title: "עמלה רק על עסקה שנסגרה",
    text: "10% רק כשנסגרת הזמנה דרך הפלטפורמה. פניות שלא נסגרו — בלי עמלה.",
  },
] as const;

const HOW = [
  "נרשמים כבעל אולם (שלב 1) ומשלימים פרופיל עסקי (שלב 2).",
  "מוסיפים אולם עם תמונות, קיבולת ומחירים.",
  "מחפשים שולחים בקשה — אתם מאשרים, מתכתבים ומסכמים.",
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
    q: "אפשר לפרסם כמה אולמות?",
    a: "כן. אפשר לנהל מספר אולמות מאותו חשבון בעל אולם.",
  },
  {
    q: "מה לגבי ספקי שירותים?",
    a: "ספקים (DJ, צילום, קייטרינג ועוד) נרשמים בנפרד בדף לספקי שירותים.",
  },
] as const;

const REGISTER_HREF = "/auth/register/business?role=VENUE_OWNER";

export default function ForVenuesPage() {
  return (
    <SitePageShell mainWidth="wide">
      <SitePageHeader
        title="בעלי אולמות — הצטרפו ל־EventForYou"
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
              פרסמו את האולם שלכם
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
              הרשמה כבעל אולם
            </Link>
            <p className="mt-3 text-center text-xs text-neutral-500">
              ספקי שירותים?{" "}
              <Link
                href="/for-freelancers"
                className="font-semibold text-emerald-950 underline-offset-2 hover:underline"
              >
                דף לספקים
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
