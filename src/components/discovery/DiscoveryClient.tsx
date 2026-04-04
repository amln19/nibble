"use client";

import { useSkippedRecipes, useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useRecipeBox } from "@/hooks/useRecipeBox";
import { useRecipeCache } from "@/hooks/useRecipeCache";
import { normalizeIngredient } from "@/lib/ingredients";
import {
  type Recipe,
  type SmartFilters,
  filterRecipes,
} from "@/lib/recipes";
import type { ScoredRecipe } from "@/lib/recommend";
import { shuffle } from "@/lib/shuffle";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExploreSection, type ExploreCategory } from "./ExploreSection";
import { KitchenMatchDialog } from "./KitchenMatchDialog";
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

function CategoriesSkeleton() {
  return (
    <div className="w-full">
      <div className="mb-3 h-4 w-28 animate-pulse rounded bg-green-200/60" />
      <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[7.5rem] w-[7.25rem] shrink-0 animate-pulse rounded-2xl bg-green-100 lg:h-auto lg:w-auto lg:aspect-square"
          />
        ))}
      </div>
    </div>
  );
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
  const [kitchenMatchOpen, setKitchenMatchOpen] = useState(false);
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

  const sourceLabel = activeQuery?.trim()
    ? `Search: “${activeQuery.trim()}”`
    : category
      ? `Category: ${category}`
      : null;

  const smartFilterCount = useMemo(
    () =>
      Object.values(smart).filter(Boolean).length,
    [smart],
  );

  const kitchenMatchBadgeCount = useMemo(() => {
    let n = smartFilterCount;
    if (pantryMode) n += 1;
    n += pantryItems.length;
    return n;
  }, [smartFilterCount, pantryMode, pantryItems.length]);

  const kitchenMatchActive =
    pantryMode || smartFilterCount > 0 || pantryItems.length > 0;

  return (
    <div className="flex flex-col">
      {/* ── Hero photo ── */}
      <section className="relative min-h-[280px] w-full overflow-hidden sm:min-h-[360px]">
        <Image
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&auto=format&fit=crop&q=80"
          alt="Beautiful food spread"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-zinc-950/65" />
        <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-8 pt-16 sm:px-6 sm:pb-12">
          <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-pink-400/40 bg-pink-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-pink-200">
            ◇ Nibble
          </span>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Recipes you&apos;ll love
          </h1>
          <p className="mt-2 max-w-sm text-sm text-zinc-300">
            Browse, search, swipe to save.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setKitchenMatchOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#15803d] transition-all hover:bg-green-400 active:translate-y-1 active:shadow-none"
            >
              <span aria-hidden>✳</span>
              Match your kitchen
              {kitchenMatchActive ? (
                <span className="rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold tabular-nums">
                  {kitchenMatchBadgeCount > 99 ? "99+" : kitchenMatchBadgeCount}
                </span>
              ) : null}
            </button>
            {sourceLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" aria-hidden />
                {sourceLabel}
              </span>
            ) : null}
            {activeQuery?.trim() ? (
              <span className="text-xs font-medium text-zinc-400">
                Pick a category below to browse instead
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {loadingCats ? (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <CategoriesSkeleton />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <ExploreSection
            categories={categories}
            selected={category}
            onSelect={handleCategorySelect}
            disabled={loadingMeals}
          />
        </div>
      )}

      {/* ── Content ── */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-8 sm:px-6 lg:pb-12">
        <KitchenMatchDialog
          open={kitchenMatchOpen}
          onClose={() => setKitchenMatchOpen(false)}
          pantryMode={pantryMode}
          onPantryModeChange={setPantryMode}
          pantryItems={pantryItems}
          onAddPantry={handleAddPantry}
          onRemovePantry={handleRemovePantry}
          smart={smart}
          onSmartChange={setSmart}
          showPantryHint={pantryMode && pantrySet.size === 0}
        />

        {loadError ? (
          <div
            className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
            role="alert"
          >
            {loadError}
          </div>
        ) : null}

        <div className="flex flex-col gap-8">
          {/* ── Find Recipes ── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl" aria-hidden>🔍</span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                Find Recipes
              </span>
            </div>
            <RecipeSearchBar
              value={searchDraft}
              onChange={setSearchDraft}
              onSubmit={handleSearchSubmit}
              onClear={clearSearch}
              activeQuery={activeQuery}
              disabled={loadingMeals}
            />
          </div>

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
        </div>
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
