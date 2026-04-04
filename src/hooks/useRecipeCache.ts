"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Recipe } from "@/lib/recipes";
import { detectPreferences, recommend, type ScoredRecipe } from "@/lib/recommend";

const LIKED_KEY = "recipe-cache-liked";
const POOL_KEY = "recipe-cache-pool";

/** Read liked recipes from sessionStorage on mount */
function hydrateFromStorage(): { liked: Recipe[]; pool: Map<string, Recipe> } {
  const liked: Recipe[] = [];
  const pool = new Map<string, Recipe>();
  try {
    const rawLiked = sessionStorage.getItem(LIKED_KEY);
    if (rawLiked) {
      const parsed = JSON.parse(rawLiked) as Recipe[];
      liked.push(...parsed);
      for (const r of parsed) pool.set(r.id, r);
    }
    const rawPool = sessionStorage.getItem(POOL_KEY);
    if (rawPool) {
      const parsed = JSON.parse(rawPool) as Recipe[];
      for (const r of parsed) pool.set(r.id, r);
    }
  } catch {
    // Ignore parse errors
  }
  return { liked, pool };
}

function persistLiked(liked: Recipe[]) {
  try {
    sessionStorage.setItem(LIKED_KEY, JSON.stringify(liked));
  } catch { /* quota */ }
}

function persistPool(pool: Map<string, Recipe>) {
  try {
    sessionStorage.setItem(POOL_KEY, JSON.stringify(Array.from(pool.values())));
  } catch { /* quota */ }
}

type CacheState = {
  pool: Map<string, Recipe>;
  liked: Recipe[];
  prefetchedCategories: Set<string>;
  prefetchedAreas: Set<string>;
  hydrated: boolean;
};

async function fetchRecipeDetails(ids: string[]): Promise<Recipe[]> {
  if (ids.length === 0) return [];
  const r = await fetch(
    `/api/recipes/details?ids=${encodeURIComponent(ids.join(","))}`,
  );
  if (!r.ok) return [];
  const data = (await r.json()) as { recipes?: Recipe[] };
  return data.recipes ?? [];
}

async function fetchIdsByArea(area: string): Promise<string[]> {
  const r = await fetch(`/api/recipes/filter?a=${encodeURIComponent(area)}`);
  if (!r.ok) return [];
  const data = (await r.json()) as { meals?: { idMeal: string }[] | null };
  return (data.meals ?? []).map((m) => m.idMeal);
}

async function fetchIdsByCategory(category: string): Promise<string[]> {
  const r = await fetch(`/api/recipes/filter?c=${encodeURIComponent(category)}`);
  if (!r.ok) return [];
  const data = (await r.json()) as { meals?: { idMeal: string }[] | null };
  return (data.meals ?? []).map((m) => m.idMeal);
}

export function useRecipeCache() {
  const cacheRef = useRef<CacheState>({
    pool: new Map(),
    liked: [],
    prefetchedCategories: new Set(),
    prefetchedAreas: new Set(),
    hydrated: false,
  });

  const [revision, setRevision] = useState(0);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    if (cacheRef.current.hydrated) return;
    const stored = hydrateFromStorage();
    // Merge — don't overwrite anything already accumulated in this instance
    for (const r of stored.liked) {
      if (!cacheRef.current.liked.some((l) => l.id === r.id)) {
        cacheRef.current.liked.push(r);
      }
    }
    for (const [id, r] of stored.pool) {
      if (!cacheRef.current.pool.has(id)) {
        cacheRef.current.pool.set(id, r);
      }
    }
    cacheRef.current.hydrated = true;
    setRevision((v) => v + 1);
  }, []);

  /** Add recipes to the pool */
  const cacheRecipes = useCallback((recipes: readonly Recipe[]) => {
    const cache = cacheRef.current;
    let added = false;
    for (const r of recipes) {
      if (!cache.pool.has(r.id)) added = true;
      cache.pool.set(r.id, r);
    }
    persistPool(cache.pool);
    if (added) setRevision((v) => v + 1);
  }, []);

  /** Record a liked recipe and trigger background prefetch if patterns emerge */
  const recordLike = useCallback((recipe: Recipe) => {
    const cache = cacheRef.current;

    cache.pool.set(recipe.id, recipe);
    if (!cache.liked.some((r) => r.id === recipe.id)) {
      cache.liked.push(recipe);
    }

    // Persist to sessionStorage so other pages can access
    persistLiked(cache.liked);
    persistPool(cache.pool);

    // Bump revision so downstream memos re-evaluate
    setRevision((v) => v + 1);

    // Check if we should prefetch based on emerging preferences
    const prefs = detectPreferences(cache.liked);

    for (const cat of prefs.topCategories) {
      if (cache.prefetchedCategories.has(cat)) continue;
      cache.prefetchedCategories.add(cat);

      void (async () => {
        try {
          const ids = await fetchIdsByCategory(cat);
          const newIds = ids.filter((id) => !cache.pool.has(id)).slice(0, 20);
          if (newIds.length === 0) return;
          const recipes = await fetchRecipeDetails(newIds);
          for (const r of recipes) cache.pool.set(r.id, r);
          persistPool(cache.pool);
          setRevision((v) => v + 1);
        } catch {
          // Best-effort
        }
      })();
    }

    for (const area of prefs.topAreas) {
      if (cache.prefetchedAreas.has(area)) continue;
      cache.prefetchedAreas.add(area);

      void (async () => {
        try {
          const ids = await fetchIdsByArea(area);
          const newIds = ids.filter((id) => !cache.pool.has(id)).slice(0, 20);
          if (newIds.length === 0) return;
          const recipes = await fetchRecipeDetails(newIds);
          for (const r of recipes) cache.pool.set(r.id, r);
          persistPool(cache.pool);
          setRevision((v) => v + 1);
        } catch {
          // Best-effort
        }
      })();
    }
  }, []);

  /** Record a passed recipe */
  const recordPass = useCallback((recipe: Recipe) => {
    cacheRef.current.pool.set(recipe.id, recipe);
    persistPool(cacheRef.current.pool);
  }, []);

  /** Get recommendations with optional category boost and offset */
  const getRecommendations = useCallback(
    (excludeIds: ReadonlySet<string>, limit = 10, activeCategory?: string | null, offset = 0): ScoredRecipe[] => {
      const cache = cacheRef.current;
      void revision;
      return recommend(
        cache.liked,
        Array.from(cache.pool.values()),
        excludeIds,
        limit,
        activeCategory,
        offset,
      );
    },
    [revision],
  );

  /** Get all-time recommendations without category boost */
  const getOverallRecommendations = useCallback(
    (excludeIds: ReadonlySet<string>, limit = 10, offset = 0): ScoredRecipe[] => {
      const cache = cacheRef.current;
      void revision;
      return recommend(
        cache.liked,
        Array.from(cache.pool.values()),
        excludeIds,
        limit,
        undefined,
        offset,
      );
    },
    [revision],
  );

  const getLikedCount = useCallback(() => {
    void revision;
    return cacheRef.current.liked.length;
  }, [revision]);

  return {
    cacheRecipes,
    recordLike,
    recordPass,
    getRecommendations,
    getOverallRecommendations,
    getLikedCount,
  };
}
