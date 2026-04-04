"use client";

import { useRecipeBox } from "@/hooks/useRecipeBox";
import type { Recipe } from "@/lib/recipes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RecipeInfoSheet } from "./RecipeInfoSheet";

export function RecipeBoxClient() {
  const { savedIds, remove, ready: recipeBoxReady } = useRecipeBox();
  const [byId, setById] = useState<Map<string, Recipe>>(new Map());
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const idsKey = useMemo(() => savedIds.join(","), [savedIds]);

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
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 md:pb-12">
      {selectedRecipe && (
        <RecipeInfoSheet
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Recipe Box
        </h1>
        <p className="mt-1 text-sm text-muted">
          Your saved recipes. Tap any card to cook with Gordon.
        </p>
      </header>

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
      ) : recipeBoxReady ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedIds.map((id) => {
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
                        className="tap-3d flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-amber-400 bg-linear-to-r from-amber-500 to-orange-500 py-2 text-xs font-black text-stone-900 shadow-[0_3px_0_rgba(180,83,9,0.5)] transition-all hover:brightness-105"
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
    </div>
  );
}
