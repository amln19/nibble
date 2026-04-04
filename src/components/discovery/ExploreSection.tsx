"use client";

import Image from "next/image";

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
};

export function ExploreSection({
  categories,
  selected,
  onSelect,
  disabled,
  embedded = false,
}: Props) {
  return (
    <section className="w-full" aria-labelledby="explore-heading">
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

      {/* Mobile / tablet: horizontal scroll */}
      <div className="-mx-1 lg:hidden">
        <div
          className="flex gap-2.5 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          role="list"
        >
          {categories.map((c) => {
            const active = selected === c.strCategory;
            return (
              <button
                key={c.strCategory}
                type="button"
                role="listitem"
                disabled={disabled}
                onClick={() => onSelect(c.strCategory)}
                className={`flex w-24 shrink-0 snap-center flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition-all active:translate-y-[3px] active:shadow-none ${
                  active
                    ? "border-primary bg-primary-light shadow-[0_3px_0_var(--primary)]"
                    : "border-edge bg-card shadow-[0_3px_0_var(--edge)] hover:border-edge-hover"
                } ${disabled ? "opacity-50" : ""}`}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface">
                  <Image
                    src={c.strCategoryThumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    draggable={false}
                  />
                </div>
                <span className={`line-clamp-1 text-center text-[11px] font-extrabold ${active ? "text-primary-dark" : "text-foreground"}`}>
                  {c.strCategory}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: grid */}
      <div
        className="hidden gap-2.5 lg:grid lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10"
        role="list"
      >
        {categories.map((c) => {
          const active = selected === c.strCategory;
          return (
            <button
              key={c.strCategory}
              type="button"
              role="listitem"
              disabled={disabled}
              onClick={() => onSelect(c.strCategory)}
              className={`group flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition-all active:translate-y-[3px] active:shadow-none ${
                active
                  ? "border-primary bg-primary-light shadow-[0_3px_0_var(--primary)]"
                  : "border-edge bg-card shadow-[0_3px_0_var(--edge)] hover:border-edge-hover"
              } ${disabled ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface">
                <Image
                  src={c.strCategoryThumb}
                  alt=""
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(min-width: 1536px) 10vw, (min-width: 1280px) 12vw, 14vw"
                  draggable={false}
                />
              </div>
              <span className={`line-clamp-1 text-center text-[11px] font-extrabold ${active ? "text-primary-dark" : "text-foreground"}`}>
                {c.strCategory}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
