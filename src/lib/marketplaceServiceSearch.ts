import type { Prisma } from "@prisma/client";
import { CATEGORY_VALUE_SEPARATOR } from "@/lib/freelancerServiceCategories";

/** התאמת קטגוריה במאגר — ערך מלא או קטגוריה ראשית + תת-קטגוריה */
export function marketplaceCategoryOrClauses(
  categories: string[]
): Prisma.ServiceWhereInput[] {
  const out: Prisma.ServiceWhereInput[] = [];
  const seen = new Set<string>();
  for (const raw of categories) {
    const cat = raw.trim();
    if (!cat || seen.has(cat)) continue;
    seen.add(cat);
    out.push({ category: cat });
    out.push({
      category: { startsWith: `${cat}${CATEGORY_VALUE_SEPARATOR}` },
    });
  }
  return out;
}

/** חיפוש לפי מילים בשם / תיאור (פריטים כמו «הגברה» שלא קיימים כשירות עצמאי) */
export function marketplaceKeywordOrClauses(
  keywords: string[]
): Prisma.ServiceWhereInput[] {
  const out: Prisma.ServiceWhereInput[] = [];
  for (const kw of keywords) {
    const k = kw.trim();
    if (!k) continue;
    out.push({ name: { contains: k } });
    out.push({ shortDescription: { contains: k } });
    out.push({ description: { contains: k } });
  }
  return out;
}

export function buildMarketplaceServiceWhere(
  categories: string[],
  keywords: string[] = []
): Prisma.ServiceWhereInput {
  const or = [
    ...marketplaceCategoryOrClauses(categories),
    ...marketplaceKeywordOrClauses(keywords),
  ];
  if (or.length === 0) return { id: -1 };
  return { OR: or };
}
