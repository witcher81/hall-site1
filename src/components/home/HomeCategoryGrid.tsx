import Link from "next/link";
import { HOME_MARKETPLACE_CATEGORIES } from "@/lib/homeCategories";
import HomeCategoryIcon from "./HomeCategoryIcon";

export default function HomeCategoryGrid() {
  return (
    <section className="home-animate-in px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-right">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            קטגוריות מרכזיות
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            בוחרים קטגוריה ומתחילים לחפש — כמו marketplace מקצועי
          </p>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {HOME_MARKETPLACE_CATEGORIES.map((cat, i) => (
            <li
              key={cat.id}
              className={`home-animate-in ${
                ["home-stagger-1", "home-stagger-2", "home-stagger-3", "home-stagger-4", "home-stagger-5", "home-stagger-6", "home-stagger-6", "home-stagger-6"][i] ?? "home-stagger-6"
              }`}
            >
              <Link
                href={cat.href}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/80 p-5 text-center shadow-sm backdrop-blur-sm transition hover:-translate-y-1 hover:border-amber-300/60 hover:shadow-lg hover:shadow-amber-500/10"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-800 transition group-hover:from-amber-100 group-hover:to-emerald-100">
                  <HomeCategoryIcon icon={cat.icon} />
                </span>
                <span className="text-sm font-semibold text-neutral-900">
                  {cat.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
