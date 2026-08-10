const STEPS = [
  {
    n: "1",
    title: "בוחרים אולם",
    text: "מסננים לפי עיר, אורחים ומחיר — ושולחים פנייה ישירה.",
  },
  {
    n: "2",
    title: "מוסיפים ספקים",
    text: "DJ, צילום, קייטרינג ועוד — מהמאגר או אחרי בחירת האולם.",
  },
  {
    n: "3",
    title: "סוגרים אירוע",
    text: "מנהלים פניות, הודעות וחבילות — הכול במקום אחד.",
  },
] as const;

export default function HomeHowItWorks() {
  return (
    <section>
      <div className="home-surface-panel mx-auto max-w-6xl p-8 sm:p-10">
        <h2 className="text-center text-2xl font-bold text-neutral-900 sm:text-3xl">
          איך זה עובד
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          שלושה שלבים פשוטים לתכנון אירוע מסודר
        </p>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-900 text-lg font-bold text-amber-300 shadow-md">
                {step.n}
              </span>
              <h3 className="mt-4 text-lg font-bold text-neutral-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
