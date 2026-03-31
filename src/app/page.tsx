import { getCurrentUser } from "@/lib/auth";
import HomeHeader from "@/components/HomeHeader";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader user={user} />

      {/* HERO מלא רוחב */}
      <section className="w-full bg-gradient-to-b from-[#0F3B2E] to-[#174D3B] text-white">
        <div className="mx-auto flex min-h-[520px] max-w-6xl flex-col items-stretch justify-center px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
          <div className="max-w-xl text-right">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-[#E5C96B]">
              HALLS HUB
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.2rem]">
              מקום אחד שכל{" "}
              <span className="text-[#E5C96B]">האירועים שלכם</span>
              {" "}מתחילים בו.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#F8F6F0] sm:text-base">
              מארקטפלייס פרימיום לאולמות וספקי שירות – חיפוש חכם, חיבור ישיר
              וניהול פניות נקי במקום אחד, בשביל חוויית תכנון אירוע יוקרתית
              ומדויקת.
            </p>
            <div className="mt-7 flex flex-wrap justify-start gap-4">
              <a
                href="/halls"
                className="rounded-full bg-[#C9A227] px-9 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(0,0,0,0.45)] transition hover:bg-[#E5C96B]"
              >
                חיפוש אולמות
              </a>
              {user?.role === "SEEKER" && (
                <a
                  href="/providers"
                  className="rounded-full border border-[#F8F6F0] px-7 py-3 text-sm font-semibold text-[#F8F6F0] bg-transparent transition hover:bg-white/10"
                >
                  חיפוש ספקים לאירוע
                </a>
              )}
            </div>
          </div>

          <div className="mt-10 w-full max-w-xs space-y-4 rounded-2xl bg-[#174D3B] px-6 py-6 text-xs text-[#F8F6F0] shadow-[0_22px_55px_rgba(0,0,0,0.65)] lg:mt-0">
            <p className="text-[11px] font-medium tracking-[0.25em] text-[#C9A227]">
              למה HALLS HUB?
            </p>
            <p className="text-sm font-medium">
              שידוך מדויק בין אולמות, ספקים ומחפשי אירועים.
            </p>
            <ul className="space-y-1.5 text-[13px] text-[#F8F6F0]">
              <li>• חיפוש מהיר לפי עיר, תקציב וכמות אורחים.</li>
              <li>• שמירה וניהול של כל הבקשות במקום אחד.</li>
              <li>• חוויית משתמש נקייה בסגנון מותג יוקרה.</li>
            </ul>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">

        {/* שני אזורים – אולמות וספקים, כרטיסים לבנים על רקע ירוק */}
        <section className="grid gap-10 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 text-right text-[#1A1A1A] shadow-lg ring-1 ring-[#E7E0CF] transition hover:shadow-xl">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              למחפשי אולמות
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5F5F5F]">
              סינון אולמות לפי עיר, גודל וטווח מחירים, צפייה בגלריות תמונות
              ושמירה למועדפים – כדי שתוכלו לסגור את המקום המושלם בראש שקט.
            </p>
            <a
              href="/halls"
              className="mt-4 inline-flex items-center text-sm font-medium text-[#C9A227] underline-offset-4 hover:underline"
            >
              להתחלת חיפוש אולמות →
            </a>
          </div>

          <div className="rounded-2xl bg-white p-7 text-right text-[#1A1A1A] shadow-lg ring-1 ring-[#E7E0CF] transition hover:shadow-xl">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              לבעלי אולמות וספקים
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5F5F5F]">
              ניהול מרוכז של האולמות והשירותים, קבלת בקשות מסודרות מלקוחות
              וסימון סטטוסים – כך שתראו תמיד מי מחכה לתשובה מכם.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              {user?.role === "VENUE_OWNER" ? (
                <a
                  href="/dashboard/venue-owner"
                  className="block text-[#0F3B2E] underline-offset-4 hover:underline"
                >
                  מעבר לדשבורד בעל אולם →
                </a>
              ) : (
                <a
                  href="/auth/register"
                  className="block text-emerald-200 underline-offset-4 hover:underline"
                >
                  הרשמה כבעל אולם →
                </a>
              )}
              {user?.role === "FREELANCER" ? (
                <a
                  href="/dashboard/freelancer"
                  className="block text-emerald-200 underline-offset-4 hover:underline"
                >
                  מעבר לדשבורד ספק →
                </a>
              ) : (
                <a
                  href="/auth/register"
                  className="block text-[#0F3B2E] underline-offset-4 hover:underline"
                >
                  הרשמה כספק שירותים →
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border-2 border-[#C9A227]/40 bg-gradient-to-br from-[#FFFBF0] to-[#FAF8F4] p-7 text-right shadow-lg ring-1 ring-[#E7E0CF]">
          <h2 className="text-lg font-semibold text-[#0F3B2E]">חבילות אירוע</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5F5F5F]">
            שילוב של אולם ושירותים (צילום, מוזיקה, קייטרינג ועוד) במקום אחד — כמו
            &quot;טיסה + מלון&quot;: רואים מה כלול, מחיר משוער וממשיכים לפנייה.
          </p>
          <a
            href="/packages"
            className="mt-4 inline-flex rounded-full bg-[#C9A227] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#E5C96B]"
          >
            לצפייה בחבילות
          </a>
        </section>

        {/* איך זה עובד – פס דק ואלגנטי */}
        <section className="mt-20 rounded-2xl bg-white px-6 py-6 text-right text-[#1A1A1A] shadow-lg ring-1 ring-[#E7E0CF]">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">
            איך זה עובד?
          </h2>
          <ol className="mt-3 space-y-1.5 text-sm text-[#5F5F5F]">
            <li>
              <span className="font-semibold text-[#C9A227]">1.</span> נרשמים או
              מתחברים בהתאם לסוג המשתמש.
            </li>
            <li>
              <span className="font-semibold text-[#C9A227]">2.</span> מחפשים
              אולמות וספקים ושולחים בקשות מסודרות.
            </li>
            <li>
              <span className="font-semibold text-[#C9A227]">3.</span> מנהלים את
              כל התשובות והפניות במקום אחד, בלי להתפזר.
            </li>
          </ol>
        </section>

        <footer className="mt-20 rounded-t-2xl bg-[#0F3B2E] px-4 py-4 text-center text-xs text-white">
          © {new Date().getFullYear()} Halls Hub – חיפוש אולמות ושירותי אירועים
        </footer>
      </main>
    </div>
  );
}
