"use client";

import { CategoryIllustration } from "./CategoryIcons";

export type ExploreCategory = {
  strCategory: string;
  strCategoryThumb: string;
};

type Props = {
  categories: ExploreCategory[];
  selected: string | null;
  onSelect: (name: string) => void;
  disabled?: boolean;
  embedded?: boolean;
  sidebar?: boolean;
};

export function ExploreSection({
  categories,
  selected,
  onSelect,
  disabled,
  embedded = false,
  sidebar = false,
}: Props) {
  return (
    <section className="flex min-h-0 w-full flex-1 flex-col" aria-labelledby="explore-heading">
      {!embedded && (
        <div className="mb-3">
          <h2
            id="explore-heading"
            className="text-xs font-extrabold uppercase tracking-widest text-muted"
          >
            Browse by category
          </h2>
        </div>
      )}

      {/* Sidebar: vertical scrollable list */}
      {sidebar ? (
        <div
          className="flex h-full flex-col gap-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
        >
          {categories.map((c, i) => {
            const active = selected === c.strCategory;
            return (
              <button
                key={c.strCategory}
                type="button"
                role="listitem"
                disabled={disabled}
                onClick={() => onSelect(c.strCategory)}
                className={`group flex w-full items-center gap-2 rounded-lg border-2 px-2 py-1.5 text-left transition-all active:translate-y-[1px] active:shadow-none ${
                  active
                    ? "border-primary bg-primary-light shadow-[0_2px_0_var(--primary)]"
                    : "border-transparent hover:border-edge hover:bg-surface"
                } ${disabled ? "opacity-50" : ""}`}
              >
                <div className="shrink-0">
                  <CategoryIllustration name={c.strCategory} active={active} size={30} index={i} />
                </div>
                <span
                  className={`min-w-0 flex-1 break-words text-left text-[11px] font-extrabold leading-tight line-clamp-1 ${active ? "text-primary-dark" : "text-foreground"}`}
                >
                  {c.strCategory}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {/* Mobile / tablet: horizontal scroll (no negative margin — stays aligned with page padding) */}
          <div className="lg:hidden">
            <div
              className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
              role="list"
            >
              {categories.map((c, i) => {
                const active = selected === c.strCategory;
                return (
                  <button
                    key={c.strCategory}
                    type="button"
                    role="listitem"
                    disabled={disabled}
                    onClick={() => onSelect(c.strCategory)}
                    className={`group flex w-20 shrink-0 snap-center flex-col items-center gap-2 rounded-2xl border-0 bg-transparent py-2 transition-all active:scale-95 ${
                      disabled ? "opacity-50" : ""
                    }`}
                  >
                    <CategoryIllustration name={c.strCategory} active={active} size={56} index={i} />
                    <span className={`line-clamp-1 w-full text-center text-[11px] font-extrabold ${active ? "text-primary" : "text-foreground"}`}>
                      {c.strCategory}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop: grid (only used when not sidebar) */}
          <div
            className="hidden gap-2.5 lg:grid lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10"
            role="list"
          >
            {categories.map((c, i) => {
              const active = selected === c.strCategory;
              return (
                <button
                  key={c.strCategory}
                  type="button"
                  role="listitem"
                  disabled={disabled}
                  onClick={() => onSelect(c.strCategory)}
                  className={`group flex flex-col items-center gap-2 rounded-2xl border-0 bg-transparent py-2 transition-all active:scale-95 ${
                    disabled ? "opacity-50" : ""
                  }`}
                >
                  <CategoryIllustration name={c.strCategory} active={active} size={60} index={i} />
                  <span className={`line-clamp-1 w-full text-center text-[11px] font-extrabold ${active ? "text-primary" : "text-foreground"}`}>
                    {c.strCategory}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
