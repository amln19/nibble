"use client";

import type { SmartFilters } from "@/lib/recipes";

const FILTERS: { key: keyof SmartFilters; label: string }[] = [
  { key: "under30", label: "Under 30 min" },
  { key: "highProtein", label: "High protein" },
  { key: "vegan", label: "Vegan" },
  { key: "beginnerFriendly", label: "Beginner" },
];

type Props = {
  value: SmartFilters;
  onChange: (next: SmartFilters) => void;
};

export function FilterChips({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-muted">
          Smart filters
        </span>
        <p className="mt-1 text-xs text-muted leading-snug">
          Times &amp; tags are inferred — use as a guide.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => {
          const active = value[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...value, [key]: !active })}
              className={`inline-flex items-center gap-1.5 rounded-2xl border-2 px-3.5 py-2 text-sm font-extrabold transition-all active:translate-y-[3px] active:shadow-none ${
                active
                  ? "border-primary-dark bg-primary text-white shadow-[0_3px_0_var(--primary-dark)]"
                  : "border-edge bg-card text-foreground shadow-[0_3px_0_var(--edge)] hover:border-edge-hover"
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
