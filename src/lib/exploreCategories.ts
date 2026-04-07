/** Virtual category — loaded via /api/recipes/all, not from MealDB list */
export const ALL_CATEGORY = "All";

type ApiCategory = { strCategory: string; strCategoryThumb: string };

/**
 * MealDB categories, ordered for the Explore UI: dietary-first, popular
 * courses, meats & seafood, carbs, small plates, then catch-all.
 */
const CATEGORY_ORDER: readonly string[] = [
  "Vegan",
  "Vegetarian",
  "Breakfast",
  "Dessert",
  "Chicken",
  "Beef",
  "Pork",
  "Lamb",
  "Goat",
  "Seafood",
  "Pasta",
  "Starter",
  "Side",
  "Miscellaneous",
];

/**
 * API categories reordered for Explore; unknown names append alphabetically at the end.
 */
export function buildOrderedExploreList(
  apiCategories: ApiCategory[],
): ApiCategory[] {
  const byName = new Map(apiCategories.map((c) => [c.strCategory, c]));
  const used = new Set<string>();
  const ordered: ApiCategory[] = [];

  for (const name of CATEGORY_ORDER) {
    const c = byName.get(name);
    if (c) {
      ordered.push(c);
      used.add(name);
    }
  }

  const rest = apiCategories
    .filter((c) => !used.has(c.strCategory))
    .sort((a, b) => a.strCategory.localeCompare(b.strCategory));

  const allRow: ApiCategory = {
    strCategory: ALL_CATEGORY,
    strCategoryThumb: "",
  };

  return [allRow, ...ordered, ...rest];
}
