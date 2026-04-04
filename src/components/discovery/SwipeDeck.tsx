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
      <div className="flex min-h-[min(70vh,520px)] w-full max-w-md flex-col items-center justify-center rounded-3xl border border-dashed border-rose-200/90 bg-white/80 p-8 text-center shadow-inner shadow-rose-100/50 xl:max-w-lg">
        <p className="font-serif text-xl font-medium text-zinc-800">
          {emptyDetail ? "No matches right now" : "You’re all caught up"}
        </p>
        <p className="mt-2 max-w-sm text-sm text-zinc-600">
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
              <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-rose-200/60">
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
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-2xl text-zinc-500 shadow-md shadow-rose-100/50 transition hover:border-rose-200 hover:bg-pink-50/80 active:scale-95"
          aria-label="Pass"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => onSave(current)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-2xl text-white shadow-md shadow-rose-200/60 transition hover:bg-rose-600 active:scale-95"
          aria-label="Save to recipe box"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
