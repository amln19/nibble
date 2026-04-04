"use client";

import type { SmartFilters } from "@/lib/recipes";

const FILTERS: { key: keyof SmartFilters; label: string; emoji: string }[] = [
  { key: "under30", label: "Under 30 min", emoji: "⚡" },
  { key: "highProtein", label: "High protein", emoji: "💪" },
  { key: "vegan", label: "Vegan", emoji: "🌱" },
  { key: "beginnerFriendly", label: "Beginner friendly", emoji: "⭐" },
];

type Props = {
  value: SmartFilters;
  onChange: (next: SmartFilters) => void;
};

export function FilterChips({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
          Smart filters
        </span>
        <p className="mt-1 text-xs text-zinc-500 leading-snug">
          Times &amp; tags are inferred — use as a guide, not exact values.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label, emoji }) => {
          const active = value[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...value, [key]: !active })}
              className={`inline-flex items-center gap-1.5 rounded-2xl border-2 px-3 py-1.5 text-sm font-bold transition-all ${
                active
                  ? "border-pink-500 bg-pink-500 text-white shadow-[0_3px_0_#be185d] active:translate-y-[3px] active:shadow-none"
                  : "border-zinc-300 bg-white text-zinc-700 shadow-[0_3px_0_#d4d4d8] hover:border-pink-300 active:translate-y-[3px] active:shadow-none"
              }`}
            >
              <span aria-hidden>{emoji}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
