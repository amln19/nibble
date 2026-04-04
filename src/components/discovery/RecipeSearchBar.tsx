"use client";

import { useCallback } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  activeQuery: string | null;
  disabled?: boolean;
};

export function RecipeSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  activeQuery,
  disabled,
}: Props) {
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit();
    },
    [onSubmit],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full lg:max-w-md lg:shrink-0"
      role="search"
    >
      <label htmlFor="recipe-search" className="sr-only">
        Search recipes by name
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id="recipe-search"
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search recipes…"
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="off"
            enterKeyHint="search"
            className="w-full rounded-xl border border-rose-100 bg-white py-2.5 pr-9 pl-3 text-sm text-zinc-900 shadow-sm shadow-rose-50/30 placeholder:text-zinc-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200/60 disabled:opacity-60"
          />
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 transition hover:bg-pink-50 hover:text-rose-700"
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={disabled || value.trim().length < 2}
          className="shrink-0 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200/80 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search
        </button>
      </div>
      {activeQuery ? (
        <p className="mt-1.5 text-xs text-zinc-500">
          Showing results for &quot;{activeQuery}&quot; · choose a category in
          Explore to browse instead
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-zinc-500">
          At least 2 characters. Matches meal names from TheMealDB.
        </p>
      )}
    </form>
  );
}
