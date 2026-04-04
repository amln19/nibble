"use client";

import { useCallback } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  activeQuery: string | null;
  disabled?: boolean;
  showSectionLabel?: boolean;
};

export function RecipeSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  activeQuery,
  disabled,
  showSectionLabel = false,
}: Props) {
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit();
    },
    [onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      {showSectionLabel ? (
        <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-zinc-400">
          Search by name
        </p>
      ) : null}
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
            className="w-full rounded-2xl border-2 border-zinc-300 bg-white py-3 pr-9 pl-4 text-sm font-medium text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 focus:border-pink-400 focus:outline-none disabled:opacity-60"
          />
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-0.5 text-zinc-400 transition hover:text-zinc-700"
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={disabled || value.trim().length < 2}
          className="shrink-0 rounded-2xl border-2 border-green-600 bg-green-500 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_#15803d] transition-all hover:bg-green-400 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          Search
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {activeQuery
          ? `Showing results for "${activeQuery}" — pick a category to browse instead`
          : "At least 2 characters to search."}
      </p>
    </form>
  );
}
