"use client";

import type { Recipe } from "@/lib/recipes";
import { SwipeCard } from "./SwipeCard";

type Props = {
  recipes: Recipe[];
  onPass: (recipe: Recipe) => void;
  onSave: (recipe: Recipe) => void;
  emptyDetail?: string;
};

export function SwipeDeck({ recipes, onPass, onSave, emptyDetail }: Props) {
  const current = recipes[0];
  const next = recipes[1];

  if (!current) {
    return (
      <div className="flex min-h-[min(64vh,520px)] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-pink-200 bg-pink-50 text-3xl shadow-[0_4px_0_#fce7f3]"
          aria-hidden
        >
          {emptyDetail ? "◇" : "✓"}
        </div>
        <p className="text-lg font-extrabold text-zinc-800">
          {emptyDetail ? "No matches right now" : "You're all caught up!"}
        </p>
        <p className="mt-2 max-w-sm text-sm text-zinc-500 leading-relaxed">
          {emptyDetail ??
            "Try another category, add pantry items, or clear filters."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full pb-24 md:pb-10">
      <div className="relative min-h-[min(68vh,540px)]">
        {next ? (
          <div
            className="pointer-events-none absolute inset-0 flex justify-center opacity-50"
            aria-hidden
          >
            <div className="w-full scale-[0.94]">
              <div className="overflow-hidden rounded-3xl border-2 border-zinc-200 shadow-[0_4px_0_#e4e4e7]">
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

      {/* Duolingo-style action buttons */}
      <div className="mt-8 flex items-start justify-center gap-12 sm:gap-16">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => onPass(current)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white text-2xl text-zinc-500 shadow-[0_4px_0_#d4d4d8] transition-all hover:border-zinc-400 hover:text-zinc-700 active:translate-y-1 active:shadow-none"
            aria-label="Pass"
          >
            ✕
          </button>
          <span className="text-xs font-bold text-zinc-400">Pass</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => onSave(current)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-pink-600 bg-pink-500 text-2xl text-white shadow-[0_4px_0_#be185d] transition-all hover:bg-pink-400 active:translate-y-1 active:shadow-none"
            aria-label="Save to recipe box"
          >
            ♥
          </button>
          <span className="text-xs font-bold text-pink-600">Save</span>
        </div>
      </div>
    </div>
  );
}
