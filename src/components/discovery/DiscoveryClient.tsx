"use client";

import {
  useRecipeBox,
  useSkippedRecipes,
  useLocalStorageState,
} from "@/hooks/useLocalStorageState";
import { useRecipeCache } from "@/hooks/useRecipeCache";
import { normalizeIngredient } from "@/lib/ingredients";
import {
  type Recipe,
  type SmartFilters,
  filterRecipes,
} from "@/lib/recipes";
import type { ScoredRecipe } from "@/lib/recommend";
import { shuffle } from "@/lib/shuffle";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExploreSection, type ExploreCategory } from "./ExploreSection";
import { FilterChips } from "./FilterChips";
import { PantryPanel } from "./PantryPanel";
import { RecipeSearchBar } from "./RecipeSearchBar";
import { SwipeDeck } from "./SwipeDeck";
import { RecommendationBar } from "./RecommendationBar";
import { SavedRecipesStrip } from "./SavedRecipesStrip";

const defaultFilters: SmartFilters = {
  under30: false,
  highProtein: false,
  vegan: false,
  beginnerFriendly: false,
};

async function fetchRecipeDetails(ids: string[]): Promise<Recipe[]> {
  if (ids.length === 0) return [];
  const r = await fetch(
    `/api/recipes/details?ids=${encodeURIComponent(ids.join(","))}`,
  );
  if (!r.ok) throw new Error("details");
  const data = (await r.json()) as { recipes?: Recipe[] };
  return data.recipes ?? [];
}

export function DiscoveryClient() {
  const [smart, setSmart] = useState<SmartFilters>(defaultFilters);
  const [pantryMode, setPantryMode] = useState(false);
  const [pantryItems, setPantryItems] = useLocalStorageState<string[]>(
    "recipe-pantry-items",
    [],
  );
  const { savedIds, add: saveRecipe, remove: removeFromBox } = useRecipeBox();
  const { skippedIds, skip } = useSkippedRecipes();
  const { cacheRecipes, recordLike, recordPass, getRecommendations } =
    useRecipeCache();

  const [categories, setCategories] = useState<ExploreCategory[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [apiRecipes, setApiRecipes] = useState<Recipe[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showRecs, setShowRecs] = useState(false);
  const [likedCount, setLikedCount] = useState(0);
  const [savedDetails, setSavedDetails] = useState<Map<string, Recipe>>(
    () => new Map(),
  );

  const savedIdsKey = useMemo(() => savedIds.join(","), [savedIds]);

  const upsertSavedRecipe = useCallback((r: Recipe) => {
    setSavedDetails((prev) => new Map(prev).set(r.id, r));
  }, []);

  useEffect(() => {
    if (savedIds.length === 0) {
      setSavedDetails(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const recipes = await fetchRecipeDetails(savedIds);
        if (cancelled) return;
        setSavedDetails((prev) => {
          const next = new Map<string, Recipe>();
          for (const id of savedIds) {
            const fromApi = recipes.find((x) => x.id === id);
            if (fromApi) next.set(id, fromApi);
            else {
              const keep = prev.get(id);
              if (keep) next.set(id, keep);
            }
          }
          return next;
        });
      } catch {
        /* keep cached / optimistic rows */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [savedIdsKey]);

  const handleRemoveSaved = useCallback(
    (id: string) => {
      removeFromBox(id);
      setSavedDetails((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
    [removeFromBox],
  );

  const savedRecipesOrdered = useMemo(
    () =>
      savedIds
        .map((id) => savedDetails.get(id))
        .filter((r): r is Recipe => r != null),
    [savedIds, savedDetails],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/recipes/categories");
        if (!r.ok) throw new Error("categories");
        const data = (await r.json()) as {
          categories?: ExploreCategory[];
        };
        if (cancelled) return;
        const list = data.categories ?? [];
        setCategories(list);
        const preferred =
          list.find((c) => c.strCategory === "Dessert")?.strCategory ??
          list.find((c) => c.strCategory === "Chicken")?.strCategory ??
          list[0]?.strCategory ??
          null;
        setCategory(preferred);
      } catch {
        if (!cancelled) {
          setLoadError("Could not load categories. Check your connection.");
        }
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMeals = useCallback(async (c: string) => {
    setLoadingMeals(true);
    setLoadError(null);
    setApiRecipes([]);
    setShowRecs(false);
    try {
      const r = await fetch(`/api/recipes/filter?c=${encodeURIComponent(c)}`);
      if (!r.ok) throw new Error("filter");
      const data = (await r.json()) as {
        meals?: { idMeal: string }[] | null;
      };
      const meals = data.meals;
      if (!meals || !Array.isArray(meals) || meals.length === 0) {
        setApiRecipes([]);
        return;
      }
      const ids = meals.map((m) => m.idMeal).slice(0, 40);
      const recipes = await fetchRecipeDetails(ids);
      const shuffled = shuffle(recipes);
      cacheRecipes(shuffled);
      setApiRecipes(shuffled);
    } catch {
      setLoadError("Could not load recipes. Try another category.");
      setApiRecipes([]);
    } finally {
      setLoadingMeals(false);
    }
  }, [cacheRecipes]);

  const loadSearch = useCallback(async (q: string) => {
    setLoadingMeals(true);
    setLoadError(null);
    setApiRecipes([]);
    setShowRecs(false);
    try {
      const r = await fetch(
        `/api/recipes/search?s=${encodeURIComponent(q.trim())}`,
      );
      if (!r.ok) throw new Error("search");
      const data = (await r.json()) as {
        meals?: { idMeal: string }[] | null;
      };
      const meals = data.meals;
      if (!meals || !Array.isArray(meals) || meals.length === 0) {
        setApiRecipes([]);
        return;
      }
      const ids = meals.map((m) => m.idMeal).slice(0, 40);
      const recipes = await fetchRecipeDetails(ids);
      const shuffled = shuffle(recipes);
      cacheRecipes(shuffled);
      setApiRecipes(shuffled);
    } catch {
      setLoadError("Search failed. Try again.");
      setApiRecipes([]);
    } finally {
      setLoadingMeals(false);
    }
  }, [cacheRecipes]);

  useEffect(() => {
    if (!category || activeQuery) return;
    void loadMeals(category);
  }, [category, loadMeals, activeQuery]);

  useEffect(() => {
    const q = activeQuery?.trim();
    if (!q) return;
    void loadSearch(q);
  }, [activeQuery, loadSearch]);

  const handleSearchSubmit = useCallback(() => {
    const q = searchDraft.trim();
    if (q.length < 2) return;
    setActiveQuery(q);
  }, [searchDraft]);

  const clearSearch = useCallback(() => {
    setSearchDraft("");
    setActiveQuery(null);
  }, []);

  const handleCategorySelect = useCallback((c: string) => {
    setActiveQuery(null);
    setSearchDraft("");
    setCategory(c);
  }, []);

  const pantrySet = useMemo(
    () => new Set(pantryItems.map((s) => normalizeIngredient(s))),
    [pantryItems],
  );

  const excludeIds = useMemo(
    () => new Set<string>([...savedIds, ...skippedIds]),
    [savedIds, skippedIds],
  );

  const deck = useMemo(
    () =>
      filterRecipes(apiRecipes, {
        smart,
        pantryMode,
        pantry: pantrySet,
        excludeIds,
      }),
    [apiRecipes, smart, pantryMode, pantrySet, excludeIds],
  );

  // Auto-show recommendations when deck empties with enough likes
  const deckIsEmpty = !loadingMeals && deck.length === 0 && apiRecipes.length > 0;
  useEffect(() => {
    if (deckIsEmpty && likedCount >= 2) {
      setShowRecs(true);
    }
  }, [deckIsEmpty, likedCount]);

  const [recsPage, setRecsPage] = useState(0);
  const recommendations: ScoredRecipe[] = useMemo(() => {
    if (!showRecs) return [];
    return getRecommendations(excludeIds, 10, category, recsPage * 10);
  }, [showRecs, getRecommendations, excludeIds, category, recsPage]);

  const handleSave = useCallback(
    (r: Recipe) => {
      saveRecipe(r.id);
      upsertSavedRecipe(r);
      recordLike(r);
      setLikedCount((c) => c + 1);
    },
    [saveRecipe, upsertSavedRecipe, recordLike],
  );

  const handlePass = useCallback(
    (r: Recipe) => {
      skip(r.id);
      recordPass(r);
    },
    [skip, recordPass],
  );

  const anySmart =
    smart.under30 ||
    smart.highProtein ||
    smart.vegan ||
    smart.beginnerFriendly;

  const someRecipesFilteredOut = useMemo(() => {
    if (loadingMeals || apiRecipes.length === 0 || deck.length > 0) return false;
    return apiRecipes.some((r) => !excludeIds.has(r.id));
  }, [loadingMeals, apiRecipes, deck.length, excludeIds]);

  const emptyDetailText = useMemo(() => {
    if (loadingMeals || deck.length > 0) return undefined;
    if (activeQuery?.trim() && apiRecipes.length === 0) {
      return `No recipes found for "${activeQuery}". Try another word or browse a category in Explore.`;
    }
    if (someRecipesFilteredOut && (pantryMode || anySmart)) {
      return "Pantry mode scores main ingredients (not every line from the API). Smart filters stack. Try another Explore category, add staples like onion, rice, or olive oil, or turn off filters you're not using.";
    }
    return undefined;
  }, [
    activeQuery,
    apiRecipes.length,
    anySmart,
    deck.length,
    loadingMeals,
    pantryMode,
    someRecipesFilteredOut,
  ]);

  function handleAddPantry(raw: string) {
    const n = normalizeIngredient(raw);
    if (!n) return;
    setPantryItems((prev) => (prev.includes(n) ? prev : [...prev, n]));
  }

  function handleRemovePantry(item: string) {
    setPantryItems((prev) => prev.filter((x) => x !== item));
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-32 sm:px-6 lg:px-8 lg:pb-12">
      {loadingCats ? (
        <p className="mb-6 text-center text-sm text-zinc-500">
          Loading categories…
        </p>
      ) : (
        <div className="mb-8 lg:mb-10">
          <ExploreSection
            categories={categories}
            selected={category}
            onSelect={handleCategorySelect}
            disabled={loadingMeals}
          />
        </div>
      )}

      {loadError ? (
        <p className="mb-6 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-center text-sm text-red-900">
          {loadError}
        </p>
      ) : null}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10 lg:gap-y-8">
        <main className="flex flex-col lg:col-span-7 xl:col-span-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="text-center lg:min-w-0 lg:flex-1 lg:text-left">
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                Discover
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Swipe right to save to your recipe box · left to pass
              </p>
            </div>
            <RecipeSearchBar
              value={searchDraft}
              onChange={setSearchDraft}
              onSubmit={handleSearchSubmit}
              onClear={clearSearch}
              activeQuery={activeQuery}
              disabled={loadingMeals}
            />
          </header>

          <SavedRecipesStrip
            recipes={savedRecipesOrdered}
            onRemove={handleRemoveSaved}
          />

          {loadingMeals ? (
            <div className="flex min-h-[min(60vh,420px)] items-center justify-center rounded-3xl border border-dashed border-rose-200/80 bg-white/70 shadow-inner shadow-rose-100/40">
              <p className="text-sm font-medium text-zinc-600">
                {activeQuery ? "Searching…" : "Loading recipes…"}
              </p>
            </div>
          ) : (
            <SwipeDeck
              recipes={deck}
              onPass={handlePass}
              onSave={handleSave}
              emptyDetail={emptyDetailText}
            />
          )}

          {!showRecs && likedCount >= 2 && deck.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRecs(true)}
              className="mt-4 w-full rounded-2xl border border-rose-200 bg-white/90 py-3 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-50 active:scale-[0.98]"
            >
              Show my recommendations ({likedCount} liked)
            </button>
          )}

          {showRecs && recommendations.length > 0 && (
            <RecommendationBar
              recommendations={recommendations}
              onSave={(r: Recipe) => {
                saveRecipe(r.id);
                upsertSavedRecipe(r);
                recordLike(r);
                setLikedCount((c) => c + 1);
              }}
              onRefresh={() => setRecsPage((p) => p + 1)}
            />
          )}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:col-span-5 xl:col-span-4">
          <PantryPanel
            pantryMode={pantryMode}
            onPantryModeChange={setPantryMode}
            pantryItems={pantryItems}
            onAdd={handleAddPantry}
            onRemove={handleRemovePantry}
          />
          <FilterChips value={smart} onChange={setSmart} />
          {pantryMode && pantrySet.size === 0 ? (
            <p className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
              Add what's in your fridge to see recipes you can make with those
              ingredients.
            </p>
          ) : null}
        </aside>
      </div>

      <p className="mt-10 text-center text-[11px] text-zinc-400">
        Recipe data from{" "}
        <a
          href="https://www.themealdb.com/"
          className="text-rose-600/90 underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          TheMealDB
        </a>
        . Times and tags are estimated from each meal's text.
      </p>
    </div>
  );
}
