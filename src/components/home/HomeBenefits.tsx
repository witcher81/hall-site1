const BENEFITS = [
  {
    title: "חוסך זמן",
    text: "אולם וספקים באתר אחד — בלי לפתוח עשרות טאבים.",
    icon: "⏱",
  },
  {
    title: "השוואת מחירים",
    text: "טווחי מחיר ברורים לפני שמתקשרים.",
    icon: "⚖",
  },
  {
    title: "ביקורות אמיתיות",
    text: "דירוגים מלקוחות שכבר עבדו עם הספק.",
    icon: "★",
  },
  {
    title: "הכול במקום אחד",
    text: "פניות, הודעות, מועדפים וחבילות אירוע.",
    icon: "◎",
  },
] as const;

export default function HomeBenefits() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-right text-2xl font-bold text-neutral-900 sm:text-3xl">
          למה להשתמש באתר
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <li
              key={b.title}
              className="home-surface-card p-5 text-right"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-lg text-amber-300"
                aria-hidden
              >
                {b.icon}
              </span>
              <h3 className="mt-4 font-bold text-neutral-900">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {b.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
