"use client";

import { useRecipeBox } from "@/hooks/useRecipeBox";
import { useRecipeCache } from "@/hooks/useRecipeCache";
import type { Recipe } from "@/lib/recipes";
import type { ScoredRecipe } from "@/lib/recommend";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RecipeInfoSheet } from "./RecipeInfoSheet";

export function RecipeBoxClient() {
  const { savedIds, add: saveRecipe, remove, ready: recipeBoxReady } = useRecipeBox();
  const { getOverallRecommendations } = useRecipeCache();
  const [byId, setById] = useState<Map<string, Recipe>>(new Map());
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recsReady, setRecsReady] = useState(false);

  const idsKey = useMemo(() => savedIds.join(","), [savedIds]);

  const filteredIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return savedIds;
    return savedIds.filter((id) => {
      const title = byId.get(id)?.title?.toLowerCase() ?? "";
      return title.includes(q);
    });
  }, [savedIds, byId, searchQuery]);

  // Show recs after initial load
  useEffect(() => {
    if (recipeBoxReady && !loading) setRecsReady(true);
  }, [recipeBoxReady, loading]);

  const excludeSet = useMemo(() => new Set(savedIds), [savedIds]);
  const overallRecs: ScoredRecipe[] = useMemo(() => {
    if (!recsReady) return [];
    return getOverallRecommendations(excludeSet, 10);
  }, [recsReady, getOverallRecommendations, excludeSet]);

  useEffect(() => {
    if (!idsKey) {
      setById(new Map());
      setLoadError(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const r = await fetch(
          `/api/recipes/details?ids=${encodeURIComponent(idsKey)}`,
        );
        if (!r.ok) throw new Error("fetch");
        const data = (await r.json()) as { recipes?: Recipe[] };
        if (cancelled) return;
        const list = data.recipes ?? [];
        const map = new Map<string, Recipe>();
        for (const recipe of list) {
          map.set(recipe.id, recipe);
        }
        setById(map);
        const expected = idsKey.split(",").filter(Boolean).length;
        if (list.length < expected) {
          setLoadError(true);
        }
      } catch {
        if (!cancelled) {
          setById(new Map());
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return (
    <div className="mx-auto w-full max-w-8xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 md:pb-8">
      {selectedRecipe && (
        <RecipeInfoSheet
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      <header className="mb-6 rounded-3xl border-2 border-primary/40 bg-primary/5 px-6 py-5 shadow-[0_4px_0_var(--primary)]">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Recipe Box
        </h1>
        <p className="mt-1 text-sm text-foreground">
          Your saved recipes. Tap any card to cook with Gordon.
        </p>
      </header>

      {recipeBoxReady && savedIds.length > 0 ? (
        <div className="mb-6 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your saved recipes"
              autoComplete="off"
              autoCapitalize="off"
              className="w-full rounded-2xl border-2 border-edge bg-card py-3 pr-9 pl-11 text-sm font-bold text-foreground placeholder:font-normal placeholder:text-muted shadow-[0_3px_0_var(--edge)] transition-all focus:border-primary focus:shadow-[0_3px_0_var(--primary)] focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-0.5 text-muted transition hover:text-foreground"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!recipeBoxReady ? (
        <p className="mb-6 text-center text-sm font-bold text-muted">
          Loading your recipe box\u2026
        </p>
      ) : null}

      {recipeBoxReady && loading && savedIds.length > 0 ? (
        <div className="mb-6 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface border-t-primary" />
        </div>
      ) : null}

      {recipeBoxReady && loadError && savedIds.length > 0 ? (
        <p className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 shadow-[0_3px_0_#fcd34d]">
          ⚠️ Some recipes could not be loaded. You can remove them below.
        </p>
      ) : null}

      {recipeBoxReady && savedIds.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-edge bg-surface p-12 text-center shadow-[0_4px_0_var(--edge)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary bg-primary-light text-3xl shadow-[0_4px_0_var(--primary)]">
            🍳
          </div>
          <p className="text-lg font-extrabold text-foreground">Nothing saved yet!</p>
          <p className="mt-1 text-sm text-muted">Start swiping to find recipes you love.</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl border-2 border-primary-dark bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
          >
            Start swiping
          </Link>
        </div>
      ) : recipeBoxReady && filteredIds.length === 0 && searchQuery.trim() ? (
        <div className="rounded-3xl border-2 border-dashed border-edge bg-surface p-10 text-center shadow-[0_4px_0_var(--edge)]">
          <p className="font-extrabold text-foreground">No matches for &ldquo;{searchQuery.trim()}&rdquo;</p>
          <p className="mt-1 text-sm text-muted">Try a different word or clear the search.</p>
        </div>
      ) : recipeBoxReady ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredIds.map((id) => {
            const r = byId.get(id);
            return (
              <li
                key={id}
                className="group overflow-hidden rounded-2xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)] transition-all hover:shadow-[0_6px_0_var(--edge)] hover:-translate-y-0.5"
              >
                {/* Clickable image area */}
                <button
                  type="button"
                  className="relative w-full text-left"
                  onClick={() => r && setSelectedRecipe(r)}
                  disabled={!r}
                  aria-label={r ? `View details for ${r.title}` : undefined}
                >
                  {r?.imageUrl ? (
                    <div className="relative aspect-4/3 bg-surface overflow-hidden">
                      <Image
                        src={r.imageUrl}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-4/3 items-center justify-center bg-surface text-sm text-muted">
                      Couldn&apos;t load preview
                    </div>
                  )}
                </button>

                <div className="p-4">
                  <h2 className="font-extrabold text-foreground">
                    {r?.title ?? "Recipe"}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {r?.tagline ??
                      (id.startsWith("r") && /^r\d+$/.test(id)
                        ? "Saved before live recipes — remove or save again."
                        : "Not found — remove to clear.")}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    {r?.instructions ? (
                      <Link
                        href={`/cook?id=${encodeURIComponent(id)}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-primary bg-primary-light py-2 text-xs font-extrabold text-primary-dark shadow-[0_3px_0_var(--primary)] transition-all hover:bg-primary hover:text-white hover:shadow-[0_3px_0_var(--primary-dark)] active:translate-y-0.5 active:shadow-none"
                      >
                        <span>🪿</span> Cook with Gordon
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      className="shrink-0 rounded-xl border-2 border-edge px-3 py-2 text-xs font-extrabold text-muted transition-all hover:border-red-300 hover:text-red-600 active:translate-y-0.5"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* ── Recommendations ── */}
      {overallRecs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-extrabold text-foreground">
            Recommended for you
          </h2>
          <p className="mt-1 text-sm text-muted">
            Based on what you liked this session
          </p>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-3">
            {overallRecs.map((r) => (
              <div
                key={r.id}
                className="group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)] transition-all hover:-translate-y-0.5"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={r.imageUrl}
                    alt={r.title}
                    fill
                    sizes="160px"
                    className="object-cover transition group-hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-primary-dark shadow-sm">
                    {Math.round(r.score * 100)}% match
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-2.5">
                  <p className="line-clamp-2 break-words text-sm font-extrabold leading-snug text-foreground">
                    {r.title}
                  </p>
                  <p className="mt-1 line-clamp-2 break-words text-[11px] leading-snug text-muted">
                    {r.category}{r.area ? ` · ${r.area}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => saveRecipe(r.id)}
                    className="mt-2 w-full rounded-xl border-2 border-primary-dark bg-primary py-1.5 text-xs font-extrabold text-white shadow-[0_3px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
