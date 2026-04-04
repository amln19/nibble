import type { Recipe } from "./recipes";
import { normalizeIngredient } from "./ingredients";

/** Preference vector built from liked recipes in a swipe session */
export type TasteProfile = {
  categoryFreq: Record<string, number>;
  areaFreq: Record<string, number>;
  ingredientFreq: Record<string, number>;
  tagWeights: { highProtein: number; vegan: number; beginnerFriendly: number };
  avgTime: number;
  totalLikes: number;
};

/** Build a taste profile from the recipes a user swiped right on */
export function buildTasteProfile(liked: readonly Recipe[]): TasteProfile {
  const categoryFreq: Record<string, number> = {};
  const areaFreq: Record<string, number> = {};
  const ingredientFreq: Record<string, number> = {};
  const tagWeights = { highProtein: 0, vegan: 0, beginnerFriendly: 0 };
  let totalTime = 0;

  for (const r of liked) {
    if (r.category) categoryFreq[r.category] = (categoryFreq[r.category] ?? 0) + 1;
    if (r.area) areaFreq[r.area] = (areaFreq[r.area] ?? 0) + 1;

    for (const ing of r.ingredients) {
      const n = normalizeIngredient(ing);
      if (n.length > 2) ingredientFreq[n] = (ingredientFreq[n] ?? 0) + 1;
    }

    if (r.tags.highProtein) tagWeights.highProtein++;
    if (r.tags.vegan) tagWeights.vegan++;
    if (r.tags.beginnerFriendly) tagWeights.beginnerFriendly++;

    totalTime += r.timeMinutes;
  }

  return {
    categoryFreq,
    areaFreq,
    ingredientFreq,
    tagWeights,
    avgTime: liked.length > 0 ? totalTime / liked.length : 30,
    totalLikes: liked.length,
  };
}

/** Score a single recipe against a taste profile. Returns 0–1. */
function scoreRecipe(recipe: Recipe, profile: TasteProfile): number {
  if (profile.totalLikes === 0) return 0;

  // Category affinity (0–1)
  const catScore = recipe.category
    ? (profile.categoryFreq[recipe.category] ?? 0) / profile.totalLikes
    : 0;

  // Area/cuisine affinity (0–1)
  const areaScore = recipe.area
    ? (profile.areaFreq[recipe.area] ?? 0) / profile.totalLikes
    : 0;

  // Ingredient overlap — what fraction of this recipe's ingredients appeared in liked recipes
  let ingHits = 0;
  const recipeIngs = recipe.ingredients.map((i) => normalizeIngredient(i)).filter((i) => i.length > 2);
  for (const ing of recipeIngs) {
    if ((profile.ingredientFreq[ing] ?? 0) > 0) ingHits++;
  }
  const ingScore = recipeIngs.length > 0 ? ingHits / recipeIngs.length : 0;

  // Tag alignment (0–1)
  let tagHits = 0;
  let tagTotal = 0;
  if (profile.tagWeights.highProtein > 0) {
    tagTotal++;
    if (recipe.tags.highProtein) tagHits++;
  }
  if (profile.tagWeights.vegan > 0) {
    tagTotal++;
    if (recipe.tags.vegan) tagHits++;
  }
  if (profile.tagWeights.beginnerFriendly > 0) {
    tagTotal++;
    if (recipe.tags.beginnerFriendly) tagHits++;
  }
  const tagScore = tagTotal > 0 ? tagHits / tagTotal : 0;

  // Time proximity — closer to avg liked time = higher score
  const maxDelta = 60; // minutes
  const timeDelta = Math.abs(recipe.timeMinutes - profile.avgTime);
  const timeScore = Math.max(0, 1 - timeDelta / maxDelta);

  // Weighted combination
  return (
    catScore * 0.30 +
    areaScore * 0.25 +
    ingScore * 0.25 +
    tagScore * 0.10 +
    timeScore * 0.10
  );
}

export type ScoredRecipe = Recipe & { score: number };

/**
 * Recommend recipes from a candidate pool based on swipe-session likes.
 * Returns up to `limit` recipes sorted by score, with 1-2 wildcards injected
 * from categories the user hasn't seen yet.
 */
/**
 * Recommend recipes from a candidate pool based on swipe-session likes.
 * When `activeCategory` is provided, recipes from that category get a boost
 * so switching categories surfaces relevant picks first without forgetting
 * cross-category preferences.
 */
export function recommend(
  liked: readonly Recipe[],
  candidates: readonly Recipe[],
  excludeIds: ReadonlySet<string>,
  limit = 10,
  activeCategory?: string | null,
  /** Skip the first `offset` scored results — used for refresh/pagination */
  offset = 0,
): ScoredRecipe[] {
  if (liked.length === 0) return [];

  const profile = buildTasteProfile(liked);
  const likedIds = new Set(liked.map((r) => r.id));

  const ACTIVE_CAT_BOOST = 0.15;

  // Score all eligible candidates
  const scored: ScoredRecipe[] = [];
  const unseenCategories: ScoredRecipe[] = [];

  for (const recipe of candidates) {
    if (excludeIds.has(recipe.id) || likedIds.has(recipe.id)) continue;

    let score = scoreRecipe(recipe, profile);

    // Boost recipes matching the currently active category
    if (activeCategory && recipe.category === activeCategory) {
      score = Math.min(1, score + ACTIVE_CAT_BOOST);
    }

    const entry = { ...recipe, score };

    // Track recipes from categories the user never liked (wildcard pool)
    const isFromUnseenCategory = recipe.category
      ? !(recipe.category in profile.categoryFreq)
      : false;

    if (isFromUnseenCategory) {
      unseenCategories.push(entry);
    } else {
      scored.push(entry);
    }
  }

  // Sort scored by score descending
  scored.sort((a, b) => b.score - a.score);

  // Skip `offset` results so refresh shows new recipes
  const offsetScored = scored.slice(offset);

  // Take top results, inject 1-2 wildcards
  const mainSlots = Math.max(0, limit - 2);
  const result = offsetScored.slice(0, mainSlots);

  // Inject wildcards from unseen categories for diversity
  const wildcardCount = Math.min(2, limit - result.length, unseenCategories.length);
  if (wildcardCount > 0) {
    const shuffled = [...unseenCategories].sort(() => Math.random() - 0.5);
    result.push(...shuffled.slice(0, wildcardCount));
  }

  // Fill remaining slots with scored recipes if we have room
  if (result.length < limit) {
    const remaining = offsetScored.slice(mainSlots, mainSlots + (limit - result.length));
    result.push(...remaining);
  }

  // If offset exhausted the pool, wrap around from the top
  if (result.length === 0 && scored.length > 0) {
    return scored.slice(0, limit).map((r) => ({ ...r }));
  }

  return result.slice(0, limit);
}

/**
 * Detect emerging preferences from likes so far.
 * Returns categories and areas worth prefetching.
 */
export function detectPreferences(liked: readonly Recipe[]): {
  topCategories: string[];
  topAreas: string[];
} {
  if (liked.length < 2) return { topCategories: [], topAreas: [] };

  const profile = buildTasteProfile(liked);

  // Categories/areas liked 2+ times are worth prefetching
  const topCategories = Object.entries(profile.categoryFreq)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat);

  const topAreas = Object.entries(profile.areaFreq)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([area]) => area);

  return { topCategories, topAreas };
}
