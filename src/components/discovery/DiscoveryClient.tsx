"use client";

import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useRecipeBox } from "@/hooks/useRecipeBox";
import { useRecipeCache } from "@/hooks/useRecipeCache";
import { useSkippedRecipes } from "@/hooks/useLocalStorageState";
import { normalizeIngredient } from "@/lib/ingredients";
import {
  type Recipe,
  type SmartFilters,
  filterRecipes,
} from "@/lib/recipes";
import { shuffle } from "@/lib/shuffle";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExploreSection, type ExploreCategory } from "./ExploreSection";
import { KitchenMatchDialog } from "./KitchenMatchDialog";
import { RecommendationBar } from "./RecommendationBar";
import { SavedRecipesStrip } from "./SavedRecipesStrip";
import { RecipeSearchBar } from "./RecipeSearchBar";
import { SwipeDeck } from "./SwipeDeck";
import { RecipeInfoPanel } from "./RecipeInfoPanel";

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
      <div className="flex gap-2.5 overflow-hidden pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-28 w-24 shrink-0 animate-pulse rounded-2xl bg-surface"
          />
        ))}
      </div>
    </div>
  );
}

function ExploreSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 rounded-xl bg-surface p-2"
        >
          <div className="h-9 w-9 shrink-0 rounded-lg bg-edge" />
          <div className="h-3 w-24 rounded-full bg-edge" />
        </div>
      ))}
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
  const { savedIds, add: saveRecipe, remove: unsaveRecipe } = useRecipeBox();
  const { skippedIds, skip } = useSkippedRecipes();
  const { cacheRecipes, recordLike, recordPass, getRecommendations, getLikedCount } = useRecipeCache();
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [recsOffset, setRecsOffset] = useState(0);
  const [savedRecipeData, setSavedRecipeData] = useState<Recipe[]>([]);

  const [categories, setCategories] = useState<ExploreCategory[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [apiRecipes, setApiRecipes] = useState<Recipe[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [kitchenMatchOpen, setKitchenMatchOpen] = useState(false);

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
      setApiRecipes(shuffle(recipes));
    } catch {
      setLoadError("Could not load recipes. Try another category.");
      setApiRecipes([]);
    } finally {
      setLoadingMeals(false);
    }
  }, []);

  const loadSearch = useCallback(async (q: string) => {
    setLoadingMeals(true);
    setLoadError(null);
    setApiRecipes([]);
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
      setApiRecipes(shuffle(recipes));
    } catch {
      setLoadError("Search failed. Try again.");
      setApiRecipes([]);
    } finally {
      setLoadingMeals(false);
    }
  }, []);

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

  // Update current recipe when deck changes
  useEffect(() => {
    setCurrentRecipe(deck[0] ?? null);
  }, [deck]);

  // Cache loaded recipes for the recommendation engine
  useEffect(() => {
    if (apiRecipes.length > 0) cacheRecipes(apiRecipes);
  }, [apiRecipes, cacheRecipes]);

  // Fetch saved recipe data for the strip
  useEffect(() => {
    if (savedIds.length === 0) { setSavedRecipeData([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/recipes/details?ids=${encodeURIComponent(savedIds.slice(0, 10).join(","))}`);
        if (!r.ok || cancelled) return;
        const data = (await r.json()) as { recipes?: Recipe[] };
        if (!cancelled) setSavedRecipeData(data.recipes ?? []);
      } catch { /* best effort */ }
    })();
    return () => { cancelled = true; };
  }, [savedIds]);

  const handleSave = useCallback((r: Recipe) => {
    saveRecipe(r.id);
    recordLike(r);
  }, [saveRecipe, recordLike]);

  const handlePass = useCallback((r: Recipe) => {
    skip(r.id);
    recordPass(r);
  }, [skip, recordPass]);

  // Recommendations — auto-show when user has liked 3+ recipes
  const hasEnoughLikes = getLikedCount() >= 3;
  const recommendations = useMemo(() => {
    if (!hasEnoughLikes) return [];
    return getRecommendations(excludeIds, 10, category, recsOffset);
  }, [hasEnoughLikes, getRecommendations, excludeIds, category, recsOffset]);

  const handleRefreshRecs = useCallback(() => {
    setRecsOffset((prev) => prev + 10);
  }, []);

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
      return `No recipes found for "${activeQuery}". Try another word or browse a category.`;
    }
    if (someRecipesFilteredOut && (pantryMode || anySmart)) {
      return "No matches with current filters. Try another category, add staples like onion or rice, or turn off filters.";
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

  const deckCount = deck.length;
  const sourceLabel = activeQuery?.trim()
    ? `"${activeQuery.trim()}"`
    : category ?? null;

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

      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* ── Page Title ── */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Explore Gordon's Recipes
          </h1>
          <p className="mt-2 text-base text-muted sm:text-lg">
            Swipe through delicious recipes and find your next meal
          </p>
        </div>

        {/* ── Search + action strip (full width) ── */}
        <RecipeSearchBar
          value={searchDraft}
          onChange={setSearchDraft}
          onSubmit={handleSearchSubmit}
          onClear={clearSearch}
          activeQuery={activeQuery}
          disabled={loadingMeals}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setKitchenMatchOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-2xl border-2 px-4 py-2 text-xs font-extrabold transition-all active:translate-y-0.5 active:shadow-none ${
              kitchenMatchActive
                ? "border-primary bg-primary-light text-primary-dark shadow-[0_3px_0_var(--primary)]"
                : "border-edge bg-card text-foreground shadow-[0_3px_0_var(--edge)] hover:border-edge-hover"
            }`}
          >
            Kitchen Match
            {kitchenMatchActive && kitchenMatchBadgeCount > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-extrabold text-white tabular-nums">
                {kitchenMatchBadgeCount > 99 ? "99+" : kitchenMatchBadgeCount}
              </span>
            ) : null}
          </button>

          {!loadingMeals && apiRecipes.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-edge bg-card px-3 py-1.5 text-[11px] font-bold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              {deckCount} in deck
              {apiRecipes.length !== deckCount ? (
                <span className="text-muted/60"> · {apiRecipes.length - deckCount} filtered</span>
              ) : null}
            </span>
          ) : null}

          {sourceLabel ? (
            <span className="text-xs font-bold text-muted">
              Browsing {sourceLabel}
            </span>
          ) : null}
        </div>

        {loadError ? (
          <div
            className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"
            role="alert"
          >
            {loadError}
          </div>
        ) : null}

        {/* ── Mobile: stacked (explore above deck) ── */}
        <div className="lg:hidden">
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted">
                Explore
              </span>
            </div>
            <section className="rounded-3xl border-2 border-edge bg-card p-4 shadow-[0_4px_0_var(--edge)] sm:p-5">
              {loadingCats ? (
                <CategoriesSkeleton />
              ) : (
                <ExploreSection
                  categories={categories}
                  selected={category}
                  onSelect={handleCategorySelect}
                  disabled={loadingMeals}
                  embedded
                />
              )}
            </section>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted">
                Swipe Deck
              </span>
            </div>
            <section className="rounded-3xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)]">
              <div className="flex items-center justify-between border-b-2 border-edge px-5 py-3.5 sm:px-6">
                <h2 className="text-sm font-extrabold text-foreground">Your Deck</h2>
                <div className="flex gap-2 text-[11px]">
                  <span className="rounded-xl border-2 border-edge bg-surface px-2.5 py-1 font-extrabold text-muted">
                    &larr; Pass
                  </span>
                  <span className="rounded-xl border-2 border-primary bg-primary-light px-2.5 py-1 font-extrabold text-primary-dark">
                    Save &rarr;
                  </span>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                {loadingMeals ? (
                  <div className="flex min-h-[min(52vh,400px)] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-edge bg-surface px-6 py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface border-t-primary" aria-hidden />
                    <p className="text-sm font-extrabold text-muted">
                      {activeQuery ? "Searching\u2026" : "Loading recipes\u2026"}
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
              </div>
            </section>
          </div>
        </div>

        {/* ── Desktop: 3-column layout (explore, swipe deck, ingredient info) ── */}
        <div className="mt-6 hidden lg:block">
          <div className="flex h-[600px] items-stretch gap-5">
            {/* Explore sidebar (left) */}
            <div className="flex w-56 shrink-0 flex-col xl:w-64">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-muted">
                  Explore
                </span>
              </div>
              <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border-2 border-edge bg-card p-4 shadow-[0_4px_0_var(--edge)]">
                {loadingCats ? (
                  <ExploreSidebarSkeleton />
                ) : (
                  <ExploreSection
                    categories={categories}
                    selected={category}
                    onSelect={handleCategorySelect}
                    disabled={loadingMeals}
                    embedded
                    sidebar
                  />
                )}
              </section>
            </div>

            {/* Swipe Deck (middle) */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-muted">
                  Swipe Deck
                </span>
              </div>
              <section className="flex flex-1 flex-col rounded-3xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)]">
                <div className="flex shrink-0 items-center justify-between border-b-2 border-edge px-5 py-3.5">
                  <h2 className="text-sm font-extrabold text-foreground">Your Deck</h2>
                  <div className="flex gap-2 text-[11px]">
                    <span className="rounded-xl border-2 border-edge bg-surface px-2.5 py-1 font-extrabold text-muted">
                      &larr; Pass
                    </span>
                    <span className="rounded-xl border-2 border-primary bg-primary-light px-2.5 py-1 font-extrabold text-primary-dark">
                      Save &rarr;
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  {loadingMeals ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-edge bg-surface px-6 py-12">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface border-t-primary" aria-hidden />
                      <p className="text-sm font-extrabold text-muted">
                        {activeQuery ? "Searching\u2026" : "Loading recipes\u2026"}
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
                </div>
              </section>
            </div>

            {/* Ingredient Info Panel (right) */}
            <div className="flex w-56 shrink-0 flex-col xl:w-64">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-muted">
                  Recipe Info
                </span>
              </div>
              <section className="flex flex-1 flex-col overflow-hidden">
                <RecipeInfoPanel recipe={currentRecipe} />
              </section>
            </div>
          </div>
        </div>

        {/* ── Saved recipes strip ── */}
        <SavedRecipesStrip recipes={savedRecipeData} onRemove={unsaveRecipe} />

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <RecommendationBar
            recommendations={recommendations}
            onSave={handleSave}
            onRefresh={handleRefreshRecs}
          />
        )}

        <p className="mt-10 text-[11px] text-muted">
          Recipe data from{" "}
          <a
            href="https://www.themealdb.com/"
            className="font-bold text-primary-dark underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            TheMealDB
          </a>
          . Times &amp; tags are estimated.
        </p>
      </div>
    </div>
  );
}
