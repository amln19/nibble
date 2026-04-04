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
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pr-9 pl-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={disabled || value.trim().length < 2}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search
        </button>
      </div>
      {activeQuery ? (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          Showing results for &quot;{activeQuery}&quot; · choose a category in
          Explore to browse instead
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          At least 2 characters. Matches meal names from TheMealDB.
        </p>
      )}
    </form>
  );
}
