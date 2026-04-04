"use client";

import type { Recipe } from "@/lib/recipes";
import Link from "next/link";
import { useRef } from "react";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";
import { Search, CheckCircle, X, Heart, ChefHat } from "lucide-react";

type Props = {
  recipes: Recipe[];
  onPass: (recipe: Recipe) => void;
  onSave: (recipe: Recipe) => void;
  emptyDetail?: string;
};

export function SwipeDeck({ recipes, onPass, onSave, emptyDetail }: Props) {
  const current = recipes[0];
  const next = recipes[1];
  const cardRef = useRef<SwipeCardHandle>(null);

  if (!current) {
    return (
      <div className="flex min-h-[min(50vh,380px)] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge bg-surface px-6 py-12 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary bg-primary-light shadow-[0_4px_0_var(--primary)]"
          aria-hidden
        >
          {emptyDetail ? (
            <Search className="h-8 w-8 text-primary" />
          ) : (
            <CheckCircle className="h-8 w-8 text-primary" />
          )}
        </div>
        <p className="text-lg font-extrabold text-foreground">
          {emptyDetail ? "No matches right now" : "You\u2019re all caught up!"}
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
          {emptyDetail ??
            "Try another category, add pantry items, or clear filters."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full pb-24 md:pb-10 lg:pb-4">
      <div className="relative">
        {next ? (
          <div
            className="pointer-events-none absolute inset-0 z-0 flex justify-center scale-[0.94] opacity-50"
            aria-hidden
          >
            <SwipeCard
              key={next.id}
              recipe={next}
              onSwipeLeft={() => {}}
              onSwipeRight={() => {}}
            />
          </div>
        ) : null}
        <div key={current.id} className="swipe-card-promote relative z-20 flex justify-center">
          <SwipeCard
            ref={cardRef}
            recipe={current}
            onSwipeLeft={() => onPass(current)}
            onSwipeRight={() => onSave(current)}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex items-start justify-center gap-6 sm:gap-10">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => cardRef.current?.triggerFly("left")}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)] transition-all hover:border-edge-hover active:translate-y-1 active:shadow-none"
            aria-label="Pass"
          >
            <X className="h-7 w-7 text-muted hover:text-foreground transition-colors" />
          </button>
          <span className="text-xs font-extrabold text-muted">Pass</span>
        </div>

        {current.instructions && (
          <div className="flex flex-col items-center gap-2">
            <Link
              href={`/cook?id=${encodeURIComponent(current.id)}`}
              className="tap-3d flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-300 shadow-[0_4px_0_rgba(180,120,60,0.35)] transition-all hover:bg-orange-400 hover:border-orange-400 active:translate-y-1 active:shadow-none"
              aria-label="Cook this recipe with Gordon"
            >
              <ChefHat className="h-7 w-7 text-stone-900" />
            </Link>
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">Cook</span>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => cardRef.current?.triggerFly("right")}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#a0204e] bg-primary shadow-[0_4px_0_#a0204e] transition-all hover:bg-[#e8005a] hover:border-[#8a1040] hover:shadow-[0_4px_0_#8a1040] active:translate-y-1 active:shadow-none"
            aria-label="Save to recipe box"
          >
            <Heart className="h-7 w-7 text-white fill-white" />
          </button>
          <span className="text-xs font-extrabold text-primary-dark">Save</span>
        </div>
      </div>
    </div>
  );
}
