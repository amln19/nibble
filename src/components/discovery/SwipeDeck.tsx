"use client";

import type { Recipe } from "@/lib/recipes";
import { SwipeCard } from "./SwipeCard";

type Props = {
  recipes: Recipe[];
  onPass: (recipe: Recipe) => void;
  onSave: (recipe: Recipe) => void;
  /** When the feed is empty but we still have meals in the category (filters hid everything) */
  emptyDetail?: string;
};

export function SwipeDeck({ recipes, onPass, onSave, emptyDetail }: Props) {
  const current = recipes[0];
  const next = recipes[1];

  if (!current) {
    return (
      <div className="flex min-h-[min(70vh,520px)] w-full max-w-md flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50 xl:max-w-lg">
        <p className="font-serif text-xl font-medium text-zinc-800 dark:text-zinc-100">
          {emptyDetail ? "No matches right now" : "You’re all caught up"}
        </p>
        <p className="mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
          {emptyDetail ??
            "Try another category, add pantry items, clear smart filters, or pass more cards in this list."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-md pb-28 md:pb-8 xl:max-w-lg">
      <div className="relative min-h-[min(72vh,560px)] xl:min-h-[min(70vh,600px)]">
        {next ? (
          <div
            className="pointer-events-none absolute inset-0 flex justify-center opacity-60"
            aria-hidden
          >
            <div className="w-full max-w-md scale-95">
              <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element -- stacked preview */}
                <img
                  src={next.imageUrl}
                  alt=""
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </div>
          </div>
        ) : null}
        <div className="relative z-10 flex justify-center">
          <SwipeCard
            recipe={current}
            onSwipeLeft={() => onPass(current)}
            onSwipeRight={() => onSave(current)}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-6">
        <button
          type="button"
          onClick={() => onPass(current)}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-2xl shadow-md transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          aria-label="Pass"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => onSave(current)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
          aria-label="Save to recipe box"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
