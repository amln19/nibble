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
    <div className={embedded ? "" : "rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-[0_3px_0_#e4e4e7]"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-zinc-900">
            🥦 Pantry mode
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Matches meals with your ingredients. Use broad words —{" "}
            <span className="font-semibold text-green-700">chicken</span> matches &quot;chicken breast&quot;.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={pantryMode}
          onClick={() => onPantryModeChange(!pantryMode)}
          className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors ${
            pantryMode ? "border-green-600 bg-green-500" : "border-zinc-300 bg-zinc-200"
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
            placeholder="e.g. eggs, tomato, rice…"
            className="min-w-0 flex-1 rounded-2xl border-2 border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 focus:border-green-500 focus:outline-none"
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-2xl border-2 border-green-600 bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#15803d] transition-all hover:bg-green-400 active:translate-y-[3px] active:shadow-none"
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
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-pink-800 transition hover:bg-pink-100"
                >
                  {item}
                  <span className="text-pink-400" aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">
            {pantryMode
              ? "Add what's in your fridge — we'll match recipes."
              : "Turn on Pantry mode and list ingredients to filter the deck."}
          </p>
        )}
      </div>
    </div>
  );
}
