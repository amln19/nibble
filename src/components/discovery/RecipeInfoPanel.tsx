"use client";

import type { Recipe } from "@/lib/recipes";
import { useRouter } from "next/navigation";
import { ChefHat, FileText, Leaf, Dumbbell, Star, Info } from "lucide-react";

function formatIngredientLine(raw: string): string {
  if (!raw) return "";
  return raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  recipe: Recipe | null;
};

export function RecipeInfoPanel({ recipe }: Props) {
  const router = useRouter();

  if (!recipe) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-edge bg-surface p-6 text-center">
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-muted/30 bg-muted/10"
          aria-hidden
        >
          <Info className="h-6 w-6 text-muted" />
        </div>
        <p className="text-sm font-extrabold text-muted">
          Swipe to see details
        </p>
        <p className="mt-1 text-xs text-muted/70">
          Recipe info will appear here
        </p>
      </div>
    );
  }

  const meta: string[] = [];
  if (recipe.category) meta.push(recipe.category);
  if (recipe.area) meta.push(recipe.area);
  if (recipe.timeMinutes) {
    meta.push(
      `${recipe.timeIsEstimate ? "~" : ""}${recipe.timeMinutes} min est.`,
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)]">
      {/* Header */}
      <div className="flex min-w-0 shrink-0 items-center gap-3 border-b-2 border-edge bg-primary-light px-5 py-4">
        <h2 className="min-w-0 flex-1 wrap-break-word text-base font-extrabold text-foreground">
          {recipe.title}
        </h2>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {meta.length > 0 ? (
          <p className="text-sm font-bold text-muted">
            {meta.join(" · ")}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {recipe.tags.vegan && (
            <span className="flex items-center gap-1 rounded-full border-2 border-green-300 bg-green-50 px-2.5 py-0.5 text-xs font-extrabold text-green-800">
              <Leaf className="h-3.5 w-3.5" /> Vegan
            </span>
          )}
          {recipe.tags.highProtein && (
            <span className="flex items-center gap-1 rounded-full border-2 border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
              <Dumbbell className="h-3.5 w-3.5" /> High protein
            </span>
          )}
          {recipe.tags.beginnerFriendly && (
            <span className="flex items-center gap-1 rounded-full border-2 border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-blue-800">
              <Star className="h-3.5 w-3.5" /> Beginner friendly
            </span>
          )}
        </div>

        {/* Ingredients */}
        <div className="mt-6">
          <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-muted">
            <ChefHat className="h-4 w-4" /> Ingredients
          </h3>
          {recipe.ingredients.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={`${ing}-${i}`} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/40" aria-hidden />
                  {formatIngredientLine(ing)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              No ingredient list for this meal.
            </p>
          )}
        </div>

        {/* Instructions */}
        {recipe.instructions ? (
          <div className="mt-6">
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-muted">
              <FileText className="h-4 w-4" /> Instructions
            </h3>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
              {recipe.instructions}
            </div>
          </div>
        ) : null}

        {/* Cook with Gordon */}
        {recipe.instructions ? (
          <div className="mt-8 mb-2">
            <button
              type="button"
              onClick={() => {
                router.push(`/cook?id=${encodeURIComponent(recipe.id)}`);
              }}
              className="tap-3d flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-orange-300 bg-orange-300 px-6 py-4 text-sm font-black text-stone-900 shadow-[0_4px_0_rgba(180,120,60,0.3)] transition-all hover:bg-orange-400 hover:border-orange-400 hover:shadow-[0_6px_20px_rgba(251,146,60,0.35)] active:translate-y-[2px] active:shadow-none"
            >
              <ChefHat className="h-5 w-5" />
              Cook with Gordon
              <span className="rounded-lg bg-stone-900/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                Voice AI
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
