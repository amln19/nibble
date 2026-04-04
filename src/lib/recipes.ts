import { canMakeWithPantry } from "./ingredients";

export type RecipeTags = {
  highProtein: boolean;
  vegan: boolean;
  beginnerFriendly: boolean;
};

export type Recipe = {
  id: string;
  title: string;
  tagline: string;
  imageUrl: string;
  /** Direct video file URL (e.g. mp4) — not YouTube */
  videoUrl?: string;
  timeMinutes: number;
  /** When true, time is inferred from instructions (TheMealDB has no cook time) */
  timeIsEstimate?: boolean;
  tags: RecipeTags;
  ingredients: string[];
  /** Full instructions when loaded from API */
  instructions?: string;
  source?: "themealdb";
  category?: string;
  area?: string;
};

export type SmartFilters = {
  under30: boolean;
  highProtein: boolean;
  vegan: boolean;
  beginnerFriendly: boolean;
};

function matchesSmartFilters(recipe: Recipe, f: SmartFilters): boolean {
  if (f.under30 && recipe.timeMinutes > 30) return false;
  if (f.highProtein && !recipe.tags.highProtein) return false;
  if (f.vegan && !recipe.tags.vegan) return false;
  if (f.beginnerFriendly && !recipe.tags.beginnerFriendly) return false;
  return true;
}

export function filterRecipes(
  recipes: readonly Recipe[],
  options: {
    smart: SmartFilters;
    pantryMode: boolean;
    pantry: ReadonlySet<string>;
    excludeIds: ReadonlySet<string>;
  },
): Recipe[] {
  const anySmart =
    options.smart.under30 ||
    options.smart.highProtein ||
    options.smart.vegan ||
    options.smart.beginnerFriendly;

  return recipes.filter((r) => {
    if (options.excludeIds.has(r.id)) return false;
    if (anySmart && !matchesSmartFilters(r, options.smart)) return false;
    if (options.pantryMode) {
      if (options.pantry.size === 0) return false;
      if (!canMakeWithPantry(r.ingredients, options.pantry)) return false;
    }
    return true;
  });
}
