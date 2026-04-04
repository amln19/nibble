"use client";

import type { Recipe } from "@/lib/recipes";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ChefHat, FileText, Leaf, Dumbbell, Star, X } from "lucide-react";

function formatIngredientLine(raw: string): string {
  if (!raw) return "";
  return raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  recipe: Recipe;
  onClose: () => void;
};

export function RecipeInfoSheet({ recipe, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const router = useRouter();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    d.showModal();
    return () => {
      if (d.open) d.close();
    };
  }, [recipe.id]);

  function requestClose() {
    onCloseRef.current();
  }

  const meta: string[] = [];
  if (recipe.category) meta.push(recipe.category);
  if (recipe.area) meta.push(recipe.area);
  if (recipe.timeMinutes) {
    meta.push(
      `${recipe.timeIsEstimate ? "~" : ""}${recipe.timeMinutes} min est.`,
    );
  }

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const t = e.target as HTMLElement;
    if (t.closest("[data-recipe-sheet]")) return;
    requestClose();
  }

  const sheet = (
    <dialog
      ref={dialogRef}
      className="recipe-info-dialog fixed inset-0 z-9999 m-0 flex max-h-none min-h-full w-full max-w-none min-w-full flex-col items-stretch justify-end bg-transparent p-0 sm:items-center sm:justify-center sm:p-4"
      onClick={handleDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      aria-labelledby="recipe-info-title"
    >
      <div
        data-recipe-sheet
        className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col rounded-t-3xl border-2 border-edge bg-card shadow-xl sm:max-h-[min(90vh,800px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b-2 border-edge bg-primary-light px-5 py-4 rounded-t-3xl sm:rounded-t-3xl">
          <h2
            id="recipe-info-title"
            className="min-w-0 flex-1 wrap-break-word text-base font-extrabold text-foreground"
          >
            {recipe.title}
          </h2>
          <button
            type="button"
            className="relative z-10 shrink-0 touch-manipulation flex h-8 w-8 items-center justify-center rounded-xl border-2 border-edge bg-card transition-all hover:bg-surface active:translate-y-0.5"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              requestClose();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            <X className="h-4 w-4 text-muted" />
          </button>
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
                onClick={(e) => {
                  e.stopPropagation();
                  requestClose();
                  router.push(`/cook?id=${encodeURIComponent(recipe.id)}`);
                }}
                className="tap-3d flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-amber-400 bg-linear-to-r from-amber-500 to-orange-500 px-6 py-4 text-sm font-black text-stone-900 shadow-[0_4px_16px_rgba(251,191,36,0.35)] transition-all hover:shadow-[0_6px_24px_rgba(251,191,36,0.45)]"
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
    </dialog>
  );

  return createPortal(sheet, document.body);
}
