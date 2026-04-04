"use client";

import type { SmartFilters } from "@/lib/recipes";

const FILTERS: { key: keyof SmartFilters; label: string }[] = [
  { key: "under30", label: "Under 30 min" },
  { key: "highProtein", label: "High protein" },
  { key: "vegan", label: "Vegan" },
  { key: "beginnerFriendly", label: "Beginner friendly" },
];

type Props = {
  value: SmartFilters;
  onChange: (next: SmartFilters) => void;
};

export function FilterChips({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Smart filters
        </span>
        <p className="mt-1 text-xs leading-snug text-zinc-400 dark:text-zinc-500">
          Times &amp; tags are inferred from each recipe’s instructions and
          category — use as a guide, not exact nutrition or timing.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map(({ key, label }) => {
          const active = value[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...value, [key]: !active })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-amber-600 bg-amber-500/15 text-amber-950 dark:border-amber-500 dark:text-amber-100"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
