"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

type SlimRecipe = {
  id: string;
  title: string;
  imageUrl?: string;
  category: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onRecipeSelect?: (recipeId: string) => void;
  activeQuery: string | null;
  disabled?: boolean;
  showSectionLabel?: boolean;
};

export function RecipeSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  onRecipeSelect,
  activeQuery,
  disabled,
}: Props) {
  const [results, setResults] = useState<SlimRecipe[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit();
      setIsFocused(false);
    },
    [onSubmit],
  );

  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    let valid = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/recipes/search?s=${encodeURIComponent(value.trim())}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!valid) return;
        const meals = (data.meals || []).slice(0, 5).map((m: any) => ({
          id: m.idMeal,
          title: m.strMeal,
          imageUrl: m.strMealThumb,
          category: m.strCategory,
        }));
        setResults(meals);
      } catch (err) {
        // ignore
      }
    }, 300);
    return () => {
      valid = false;
      clearTimeout(timer);
    };
  }, [value]);

  const showDropdown = isFocused && results.length > 0;

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
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
              onClick={() => {
                onClear();
                setResults([]);
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-0.5 text-muted transition hover:text-foreground"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null}

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border-2 border-edge bg-card shadow-xl">
              <ul className="max-h-64 overflow-y-auto overscroll-contain">
                {results.map((r, i) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onRecipeSelect?.(r.id);
                        setIsFocused(false);
                      }}
                      className="dropdown-item flex w-full items-center gap-3 px-3 py-2 text-left transition-colors mx-1 my-0.5"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface flex items-center justify-center border-2 border-edge">
                        {r.imageUrl ? (
                          <Image
                            src={r.imageUrl}
                            alt={r.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-muted">No img</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {r.title}
                        </p>
                        <p className="truncate text-xs font-medium text-muted">
                          {r.category}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
