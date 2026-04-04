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
    <div className="rounded-2xl border border-rose-100 bg-white/95 p-4 shadow-sm shadow-rose-100/50">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Pantry mode
          </h2>
          <p className="text-xs text-zinc-500">
            Shows meals where enough of the main ingredients overlap your list
            (salt/water/etc. don’t count). Use broad words —{" "}
            <span className="text-rose-700/90">chicken</span> matches
            &quot;chicken breast&quot;.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={pantryMode}
          onClick={() => onPantryModeChange(!pantryMode)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            pantryMode ? "bg-rose-500" : "bg-zinc-200"
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
            className="min-w-0 flex-1 rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300/40"
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-rose-200/80 transition hover:bg-rose-600"
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
                  className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-rose-900 ring-1 ring-rose-100/90 transition hover:bg-pink-100/90"
                >
                  {item}
                  <span className="text-rose-400" aria-hidden>
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">
            {pantryMode
              ? "Add what’s in your fridge — we’ll match recipes."
              : "Turn on Pantry mode and list ingredients to filter the deck."}
          </p>
        )}
      </div>
    </div>
  );
}
