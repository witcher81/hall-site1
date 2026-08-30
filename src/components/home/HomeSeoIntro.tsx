/**
 * SSR intro for crawlers and agents — H1 + nested H2/H3 in raw HTML.
 * Visually hidden so the hero stays the homepage entry point for users.
 */
export default function HomeSeoIntro() {
  return (
    <section className="sr-only">
      <div className="mx-auto max-w-3xl text-right">
        <h1 className="text-2xl font-semibold text-[var(--heading)] sm:text-3xl">
          EventForYou – מקום אחד לכל האירועים
        </h1>

        <h2 className="mt-6 text-lg font-semibold text-[var(--heading)]">
          מה זה EventForYou?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
          EventForYou הוא מרקטפלייס ישראלי לאירועים בכתובת hall-site1.vercel.app:
          חיפוש והשוואת אולמות אירועים, ספקי שירותים (צילום, DJ, קייטרינג, עיצוב
          ועוד) וחבילות אירוע. מחפשים מסננים לפי עיר, מספר אורחים וסוג אירוע,
          פונים ישירות לבעלי אולמות ולפרילנסרים, ומתכננים אירוע במקום אחד — בלי
          לקפוץ בין עשרות אתרים. האתר מיועד לקהל בישראל ומציג תוכן בעברית.
        </p>

        <h3 className="mt-4 text-base font-semibold text-[var(--heading)]">
          למי זה מיועד
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
          מחפשים (אולמות, ספקים או שניהם); בעלי אולמות שמפרסמים ומקבלים פניות;
          ופרילנסרים שמנהלים פרופיל שירותים. EventForYou מחבר בין שלושת הצדדים על
          פלטפורמה אחת, כולל דפי אמון (אודות, יצירת קשר, פרטיות).
        </p>

        <h2 className="mt-6 text-lg font-semibold text-[var(--heading)]">
          ניווט באתר
        </h2>
        <h3 className="mt-3 text-base font-semibold text-[var(--heading)]">
          חיפוש וגילוי
        </h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
          <li>
            <a href="/halls" className="underline">
              אולמות
            </a>{" "}
            — /halls
          </li>
          <li>
            <a href="/providers" className="underline">
              ספקים
            </a>{" "}
            — /providers
          </li>
          <li>
            <a href="/packages" className="underline">
              חבילות
            </a>{" "}
            — /packages
          </li>
        </ul>

        <h3 className="mt-4 text-base font-semibold text-[var(--heading)]">
          אמון וקשר
        </h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
          <li>
            <a href="/about" className="underline">
              אודות
            </a>
            {" · "}
            <a href="/contact" className="underline">
              יצירת קשר
            </a>
            {" · "}
            <a href="/privacy" className="underline">
              פרטיות
            </a>
          </li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold text-[var(--heading)]">
          מפתחים וסוכני AI — EventForYou
        </h2>
        <h3 className="mt-3 text-base font-semibold text-[var(--heading)]">
          תיעוד ו-API
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          <a
            href="/developers"
            className="font-semibold text-[var(--heading)] underline"
          >
            EventForYou Developers
          </a>
          {" · "}
          <a
            href="/docs"
            className="font-semibold text-[var(--heading)] underline"
          >
            EventForYou API docs
          </a>
          {" · "}
          <a href="/developers/vercel" className="underline">
            EventForYou on Vercel
          </a>
          {" · "}
          <a href="/api/v1" className="underline">
            /api/v1
          </a>
          {" · "}
          <a href="/openapi.json" className="underline">
            OpenAPI
          </a>
          {" · "}
          <a href="/deprecation" className="underline">
            /deprecation
          </a>
        </p>
        <h3 className="mt-4 text-base font-semibold text-[var(--heading)]">
          MCP ו-llms.txt
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          <a href="/llms.txt" className="underline">
            /llms.txt
          </a>
          {" · "}
          <a href="/.well-known/mcp" className="underline">
            /.well-known/mcp
          </a>
          {" · "}
          <a href="/server.json" className="underline">
            /server.json
          </a>
          {" · "}
          <a href="/mcp" className="underline">
            /mcp
          </a>
        </p>
      </div>
    </section>
  );
}
