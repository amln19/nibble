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
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Smart filters
        </span>
        <p className="mt-1 text-xs leading-snug text-zinc-400">
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
                  ? "border-rose-400 bg-pink-50 text-rose-900 shadow-sm shadow-rose-100/60"
                  : "border-rose-100 bg-white text-zinc-700 shadow-sm shadow-rose-50/50 hover:border-rose-200"
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
