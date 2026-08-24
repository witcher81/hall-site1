/**
 * SSR-visible intro — H1 + body text in raw HTML (no client JS required).
 */
export default function HomeSeoIntro() {
  return (
    <section className="border-b border-[var(--border-soft)] bg-[var(--card)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-right">
        <h1 className="text-2xl font-semibold text-[var(--heading)] sm:text-3xl">
          EventForYou – מקום אחד לכל האירועים
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
          EventForYou הוא מרקטפלייס ישראלי לאירועים: חיפוש והשוואת אולמות אירועים,
          ספקי שירותים (צילום, DJ, קייטרינג, עיצוב ועוד) וחבילות אירוע. מחפשים
          מסננים לפי עיר, מספר אורחים וסוג אירוע, פונים ישירות לבעלי אולמות
          ולפרילנסרים, ומתכננים אירוע במקום אחד — בלי לקפוץ בין עשרות אתרים.
          בעלי אולמות וספקים מפרסמים את העסק, מקבלים פניות ומנהלים פרופיל באזור
          האישי. האתר מיועד לקהל בישראל ומציג תוכן בעברית. אפשר להתחיל בחיפוש
          אולמות, לעבור לספקי שירותים, או לעיין בחבילות מוכנות לאירוע. EventForYou
          מחבר בין מחפשי אולמות, בעלי אולמות וספקי שירותים על פלטפורמה אחת, כולל
          דפי אמון (אודות, יצירת קשר, פרטיות) ותיעוד למפתחים ולסוכני AI.
        </p>
        <h2 className="mt-6 text-base font-semibold text-[var(--heading)]">
          ניווט מהיר
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
          <li>חיפוש אולמות — /halls</li>
          <li>שירותי ספקים — /providers</li>
          <li>חבילות אירוע — /packages</li>
          <li>אודות — /about · יצירת קשר — /contact · פרטיות — /privacy</li>
          <li>
            מפתחים וסוכני AI —{" "}
            <a href="/developers" className="font-semibold text-[var(--heading)] underline">
              /developers
            </a>
            {" · "}
            <a href="/docs" className="font-semibold text-[var(--heading)] underline">
              /docs
            </a>
            {" · "}
            <a href="/api/v1" className="underline">
              /api/v1
            </a>
            {" · "}
            /llms.txt · /openapi.json · /.well-known/mcp
          </li>
        </ul>
        <p className="mt-4 text-sm text-[var(--muted)]">
          תיעוד API ציבורי לסוכנים ומפתחים:{" "}
          <a
            href="/developers"
            className="font-semibold text-[var(--heading)] underline"
          >
            EventForYou Developers
          </a>
          {" · "}
          <a href="/docs" className="font-semibold text-[var(--heading)] underline">
            EventForYou API docs
          </a>
          {" · "}
          <a href="/api/v1" className="underline">
            /api/v1
          </a>
          {" · "}
          <a href="/openapi.json" className="underline">
            OpenAPI
          </a>
          .
        </p>
      </div>
    </section>
  );
}
