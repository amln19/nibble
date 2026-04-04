"use client";

import { normalizeIngredient } from "@/lib/ingredients";
import { useCallback, useState } from "react";

type Props = {
  pantryMode: boolean;
  onPantryModeChange: (on: boolean) => void;
  pantryItems: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  embedded?: boolean;
};

export function PantryPanel({
  pantryMode,
  onPantryModeChange,
  pantryItems,
  onAdd,
  onRemove,
  embedded = false,
}: Props) {
  const [draft, setDraft] = useState("");

  const submit = useCallback(() => {
    const n = normalizeIngredient(draft);
    if (!n) return;
    onAdd(n);
    setDraft("");
  }, [draft, onAdd]);

  return (
    <div className={embedded ? "" : "rounded-2xl border-2 border-edge bg-card p-4 shadow-[0_3px_0_var(--edge)]"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            {pantryMode ? "Pantry mode" : "Kitchen mode"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Matches meals with your ingredients.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={pantryMode}
          onClick={() => onPantryModeChange(!pantryMode)}
          className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-all ${
            pantryMode
              ? "border-primary-dark bg-primary shadow-[0_2px_0_var(--primary-dark)]"
              : "border-edge bg-surface shadow-[0_2px_0_var(--edge)]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              pantryMode ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="mt-4">
        <label className="sr-only" htmlFor="pantry-input">
          Add ingredient
        </label>
        <div className="flex gap-2">
          <input
            id="pantry-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="e.g. eggs, tomato, rice\u2026"
            className="min-w-0 flex-1 rounded-2xl border-2 border-edge bg-card px-3 py-2 text-sm font-bold text-foreground placeholder:font-normal placeholder:text-muted shadow-[0_2px_0_var(--edge)] transition-all focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-2xl border-2 border-primary-dark bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none"
          >
            Add
          </button>
        </div>
        {pantryItems.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {pantryItems.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary bg-primary-light px-3 py-1 text-xs font-extrabold text-primary-dark transition-all hover:bg-primary/20 active:scale-95"
                >
                  {item}
                  <span className="text-primary/60" aria-hidden>✕</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted">
            {pantryMode
              ? "Add what\u2019s in your fridge \u2014 we\u2019ll match recipes."
              : "Turn on Pantry mode and list ingredients to filter."}
          </p>
        )}
      </div>
    </div>
  );
}
