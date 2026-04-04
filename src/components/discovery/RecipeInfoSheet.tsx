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
        className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col rounded-t-3xl border-2 border-zinc-200 bg-white shadow-xl sm:max-h-[min(90vh,800px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b-2 border-zinc-100 bg-pink-50 px-5 py-4">
          <h2
            id="recipe-info-title"
            className="min-w-0 flex-1 break-words text-base font-extrabold text-zinc-900"
          >
            {recipe.title}
          </h2>
          <button
            type="button"
            className="relative z-10 shrink-0 touch-manipulation flex h-8 w-8 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white text-lg font-bold text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
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
              <span className="rounded-full border-2 border-pink-300 bg-pink-50 px-2.5 py-0.5 text-xs font-bold text-pink-800">
                🌱 Vegan
              </span>
            )}
            {recipe.tags.highProtein && (
              <span className="rounded-full border-2 border-green-300 bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-800">
                💪 High protein
              </span>
            )}
            {recipe.tags.beginnerFriendly && (
              <span className="rounded-full border-2 border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-bold text-zinc-700">
                ⭐ Beginner friendly
              </span>
            )}
          </div>

          <h3 className="mt-6 text-xs font-extrabold uppercase tracking-widest text-zinc-400">
            Ingredients
          </h3>
          {recipe.ingredients.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-zinc-800">
              {recipe.ingredients.map((ing, i) => (
                <li key={`${ing}-${i}`} className="marker:text-zinc-400">
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
              <h3 className="mt-6 text-xs font-extrabold uppercase tracking-widest text-zinc-400">
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
