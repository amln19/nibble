"use client";

import { useRecipeBox } from "@/hooks/useRecipeBox";
import { useRecipeCache } from "@/hooks/useRecipeCache";
import type { Recipe } from "@/lib/recipes";
import type { ScoredRecipe } from "@/lib/recommend";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function RecipeCard({
  recipe,
  action,
}: {
  recipe: Recipe & { score?: number };
  action: { label: string; onClick: () => void };
}) {
  return (
    <div className="group flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition hover:shadow-md sm:w-48">
      <div className="relative aspect-square w-full overflow-hidden bg-rose-50">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            sizes="192px"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            No image
          </div>
        )}
        {"score" in recipe && typeof recipe.score === "number" && (
          <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-rose-600 shadow-sm">
            {Math.round(recipe.score * 100)}% match
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-tight text-zinc-800">
          {recipe.title}
        </p>
        <p className="mt-1 text-[11px] text-zinc-500">
          {recipe.category}{recipe.area ? ` · ${recipe.area}` : ""}
        </p>
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 w-full rounded-lg bg-rose-500 py-1.5 text-xs font-medium text-white transition hover:bg-rose-600 active:scale-95"
        >
          {action.label}
        </button>
      </div>
    </div>
  );
}

function ScrollRow({
  title,
  subtitle,
  onRefresh,
  children,
}: {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-zinc-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-rose-600 shadow-sm transition hover:bg-rose-50 active:scale-95"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            Refresh
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">{children}</div>
    </section>
  );
}

export function RecipeBoxClient() {
  const { savedIds, remove, add: saveRecipe, ready: recipeBoxReady } =
    useRecipeBox();
  const { getOverallRecommendations, cacheRecipes, recordLike } = useRecipeCache();
  const [byId, setById] = useState<Map<string, Recipe>>(new Map());
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recsReady, setRecsReady] = useState(false);

  const idsKey = useMemo(() => savedIds.join(","), [savedIds]);

  useEffect(() => {
    if (!idsKey) {
      setById(new Map());
      setLoadError(false);
      setRecsReady(true);
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
        setById((prev) => {
          const merged = new Map<string, Recipe>();
          for (const recipe of list) {
            merged.set(recipe.id, recipe);
          }
          const next = new Map<string, Recipe>();
          for (const id of savedIds) {
            const r = merged.get(id) ?? prev.get(id);
            if (r) next.set(id, r);
          }
          return next;
        });
        // Feed saved recipes into the cache pool so the recommendation
        // engine has candidates to score against on this page
        cacheRecipes(list);
        setRecsReady(true);
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
  }, [idsKey, cacheRecipes]);

  // Split saved recipes into 2 rows
  const savedRecipes = savedIds
    .map((id) => byId.get(id))
    .filter((r): r is Recipe => !!r);
  const mid = Math.ceil(savedRecipes.length / 2);
  const row1 = savedRecipes.slice(0, mid);
  const row2 = savedRecipes.slice(mid);

  // Overarching recommendations — wait until saved recipes are loaded into pool
  const excludeIds = useMemo(() => new Set(savedIds), [savedIds]);
  const [boxRecsPage, setBoxRecsPage] = useState(0);
  const overallRecs: ScoredRecipe[] = useMemo(
    () => recsReady ? getOverallRecommendations(excludeIds, 12, boxRecsPage * 12) : [],
    [recsReady, getOverallRecommendations, excludeIds, boxRecsPage],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-28 sm:px-6 lg:px-8 md:pb-12">
      <header className="mb-8 text-center md:text-left">
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 md:text-3xl">
          Recipe box
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your saved recipes and personalized recommendations
        </p>
      </header>

      {!recipeBoxReady ? (
        <p className="mb-6 text-center text-sm text-zinc-500">
          Loading your recipe box…
        </p>
      ) : null}

      {recipeBoxReady && loading && savedIds.length > 0 ? (
        <p className="mb-6 text-center text-sm text-zinc-500">
          Loading saved recipes…
        </p>
      ) : null}

      {recipeBoxReady && loadError && savedIds.length > 0 ? (
        <p className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          Some recipes could not be loaded from the API. You can still remove
          any card below.
        </p>
      ) : null}

      {recipeBoxReady && savedIds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 bg-white p-10 text-center shadow-inner">
          <p className="text-zinc-700">Nothing saved yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
          >
            Start swiping
          </Link>
        </div>
      ) : (
        <>
          <ScrollRow title="Saved recipes" subtitle={`${savedRecipes.length} recipe${savedRecipes.length === 1 ? "" : "s"} in your box`}>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {row1.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    action={{ label: "Remove", onClick: () => remove(r.id) }}
                  />
                ))}
              </div>
              {row2.length > 0 && (
                <div className="flex gap-3">
                  {row2.map((r) => (
                    <RecipeCard
                      key={r.id}
                      recipe={r}
                      action={{ label: "Remove", onClick: () => remove(r.id) }}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollRow>
        </>
      )}

      {overallRecs.length > 0 && (
        <ScrollRow
          title="Recommended for you"
          subtitle="Based on everything you've liked"
          onRefresh={() => setBoxRecsPage((p) => p + 1)}
        >
          {overallRecs.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              action={{
                label: "Save ♥",
                onClick: () => {
                  saveRecipe(r.id);
                  recordLike(r);
                  setById((prev) => new Map(prev).set(r.id, r));
                },
              }}
            />
          ))}
        </ScrollRow>
      )}
    </div>
  );
}
