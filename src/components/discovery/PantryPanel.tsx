"use client";

import { normalizeIngredient } from "@/lib/ingredients";
import { useCallback, useState } from "react";

type Props = {
  pantryMode: boolean;
  onPantryModeChange: (on: boolean) => void;
  pantryItems: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
};

export function PantryPanel({
  pantryMode,
  onPantryModeChange,
  pantryItems,
  onAdd,
  onRemove,
}: Props) {
  const [draft, setDraft] = useState("");

  const submit = useCallback(() => {
    const n = normalizeIngredient(draft);
    if (!n) return;
    onAdd(n);
    setDraft("");
  }, [draft, onAdd]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Pantry mode
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Shows meals where enough of the main ingredients overlap your list
            (salt/water/etc. don’t count). Use broad words —{" "}
            <span className="text-zinc-600 dark:text-zinc-300">chicken</span> matches
            &quot;chicken breast&quot;.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={pantryMode}
          onClick={() => onPantryModeChange(!pantryMode)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            pantryMode ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-600"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
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
            placeholder="e.g. eggs, tomato, rice…"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {item}
                  <span className="text-zinc-500" aria-hidden>
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {pantryMode
              ? "Add what’s in your fridge — we’ll match recipes."
              : "Turn on Pantry mode and list ingredients to filter the deck."}
          </p>
        )}
      </div>
    </div>
  );
}
