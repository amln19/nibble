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
      <label htmlFor="recipe-search" className="sr-only">
        Search recipes by name
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            id="recipe-search"
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search recipes"
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="off"
            enterKeyHint="search"
            className="w-full rounded-2xl border-2 border-edge bg-card py-3 pr-9 pl-11 text-sm font-bold text-foreground placeholder:font-normal placeholder:text-muted shadow-[0_3px_0_var(--edge)] transition-all focus:border-primary focus:shadow-[0_3px_0_var(--primary)] focus:outline-none disabled:opacity-50"
          />
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-0.5 text-muted transition hover:text-foreground"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={disabled || value.trim().length < 2}
          className="shrink-0 rounded-2xl border-2 border-primary-dark bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Search
        </button>
      </div>
      {activeQuery ? (
        <p className="mt-2 text-xs font-bold text-muted">
          Showing results for &ldquo;{activeQuery}&rdquo; &mdash; pick a category to browse instead
        </p>
      ) : null}
    </form>
  );
}
