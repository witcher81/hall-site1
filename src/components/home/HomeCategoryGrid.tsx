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
                className="home-surface-card home-category-card group flex flex-col items-center gap-3 p-5 text-center"
              >
                <span className="home-category-icon-wrap">
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
