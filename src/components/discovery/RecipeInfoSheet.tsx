"use client";

import type { Recipe } from "@/lib/recipes";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

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

/** Only mount when visible — parent toggles with `{infoOpen && <RecipeInfoSheet />}` */
export function RecipeInfoSheet({ recipe, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

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
      className="recipe-info-dialog fixed inset-0 z-[9999] m-0 flex max-h-none min-h-full w-full max-w-none min-w-full flex-col items-stretch justify-end bg-transparent p-0 sm:items-center sm:justify-center sm:p-4"
      onClick={handleDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      aria-labelledby="recipe-info-title"
    >
      <div
        data-recipe-sheet
        className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col rounded-t-3xl border border-rose-100/80 bg-white shadow-2xl shadow-rose-200/30 sm:max-h-[min(90vh,800px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b border-rose-100 bg-gradient-to-r from-white to-pink-50/50 px-5 py-4">
          <h2
            id="recipe-info-title"
            className="min-w-0 flex-1 break-words font-serif text-lg font-semibold text-zinc-900"
          >
            {recipe.title}
          </h2>
          <button
            type="button"
            className="relative z-10 shrink-0 touch-manipulation rounded-full p-2 text-xl leading-none text-rose-500 transition hover:bg-pink-100/80 hover:text-rose-700 active:bg-pink-200/60"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              requestClose();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {meta.length > 0 ? (
            <p className="text-sm text-zinc-600">
              {meta.join(" · ")}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {recipe.tags.vegan && (
              <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-rose-900">
                Vegan
              </span>
            )}
            {recipe.tags.highProtein && (
              <span className="rounded-full bg-rose-100/90 px-2.5 py-0.5 text-xs font-medium text-rose-950">
                High protein
              </span>
            )}
            {recipe.tags.beginnerFriendly && (
              <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-rose-100">
                Beginner friendly
              </span>
            )}
          </div>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-rose-400">
            Ingredients
          </h3>
          {recipe.ingredients.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-zinc-800">
              {recipe.ingredients.map((ing, i) => (
                <li key={`${ing}-${i}`} className="marker:text-rose-400">
                  {formatIngredientLine(ing)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              No ingredient list for this meal.
            </p>
          )}

          {recipe.instructions ? (
            <>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-rose-400">
                Instructions
              </h3>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {recipe.instructions}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </dialog>
  );

  return createPortal(sheet, document.body);
}
