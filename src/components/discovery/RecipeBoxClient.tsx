"use client";

import { useRecipeBox } from "@/hooks/useLocalStorageState";
import type { Recipe } from "@/lib/recipes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function RecipeBoxClient() {
  const { savedIds, remove } = useRecipeBox();
  const [byId, setById] = useState<Map<string, Recipe>>(new Map());
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-28 sm:px-6 lg:px-8 md:pb-12">
      <header className="mb-8 text-center md:text-left">
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 md:text-3xl">
          Recipe box
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Recipes you saved from Discover (loaded from TheMealDB)
        </p>
      </header>

      {loading && savedIds.length > 0 ? (
        <p className="mb-6 text-center text-sm text-zinc-500">
          Loading saved recipes…
        </p>
      ) : null}

      {loadError && savedIds.length > 0 ? (
        <p className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          Some recipes could not be loaded from the API (for example old saved
          IDs). You can still remove any card below — that clears it from this
          device.
        </p>
      ) : null}

      {savedIds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-200/90 bg-white/80 p-10 text-center shadow-inner shadow-rose-100/40">
          <p className="text-zinc-700">Nothing saved yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200/60 transition hover:bg-rose-600"
          >
            Start swiping
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedIds.map((id) => {
            const r = byId.get(id);
            return (
              <li
                key={id}
                className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm shadow-rose-100/50"
              >
                {r?.imageUrl ? (
                  <div className="relative aspect-[4/3] bg-rose-50">
                    <Image
                      src={r.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-rose-50 text-sm text-zinc-500">
                    Couldn’t load preview
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-semibold text-zinc-900">
                    {r?.title ?? "Recipe"}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                    {r?.tagline ??
                      (id.startsWith("r") && /^r\d+$/.test(id)
                        ? "Saved before live recipes — remove or save again from Discover."
                        : "Not found in TheMealDB — remove to clear.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-800"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
