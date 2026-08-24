/**
 * SSR intro block — meaningful HTML without relying on client JS.
 * H1 lives in HomeHero (also SSR'd); this adds body text + heading structure.
 */
export default function HomeSeoIntro() {
  return (
    <section className="border-b border-[var(--border-soft)] bg-[var(--card)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-right">
        <h2 className="text-xl font-semibold text-[var(--heading)] sm:text-2xl">
          מה זה EventForYou?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
          EventForYou הוא מרקטפלייס ישראלי לאירועים: חיפוש והשוואת אולמות אירועים,
          ספקי שירותים (צילום, DJ, קייטרינג, עיצוב ועוד) וחבילות אירוע. מחפשים
          מסננים לפי עיר, מספר אורחים וסוג אירוע, פונים ישירות לבעלי אולמות
          ולפרילנסרים, ומתכננים אירוע במקום אחד — בלי לקפוץ בין עשרות אתרים.
          בעלי אולמות וספקים מפרסמים את העסק, מקבלים פניות ומנהלים פרופיל באזור
          האישי. האתר מיועד לקהל בישראל ומציג תוכן בעברית.
        </p>
        <h3 className="mt-6 text-base font-semibold text-[var(--heading)]">
          ניווט מהיר
        </h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
          <li>חיפוש אולמות — /halls</li>
          <li>שירותי ספקים — /providers</li>
          <li>חבילות אירוע — /packages</li>
          <li>אודות — /about · יצירת קשר — /contact · פרטיות — /privacy</li>
          <li>לסוכני AI: /llms.txt · /sitemap.xml · /developers · /.well-known/mcp</li>
        </ul>
      </div>
    </section>
  );
}
