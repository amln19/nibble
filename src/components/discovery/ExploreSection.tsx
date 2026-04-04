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
      <div className="mb-3">
        {embedded ? (
          <h3
            id="explore-heading"
            className="text-xs font-extrabold uppercase tracking-widest text-zinc-400"
          >
            Categories
          </h3>
        ) : (
          <h2
            id="explore-heading"
            className="text-xs font-extrabold uppercase tracking-widest text-zinc-400"
          >
            Browse by category
          </h2>
        )}
      </div>

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
                className={`flex w-[6.5rem] shrink-0 snap-center flex-col gap-1.5 rounded-2xl border-2 p-2 text-left transition-all ${
                  active
                    ? "border-pink-400 bg-pink-50 shadow-[0_3px_0_#f9a8d4]"
                    : "border-zinc-200 bg-white shadow-[0_3px_0_#e4e4e7] hover:border-pink-300 active:translate-y-[3px] active:shadow-none"
                } ${disabled ? "opacity-50" : ""}`}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100">
                  <Image
                    src={c.strCategoryThumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="100px"
                    draggable={false}
                  />
                </div>
                <span className={`line-clamp-2 text-center text-[11px] font-bold ${active ? "text-pink-700" : "text-zinc-700"}`}>
                  {c.strCategory}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: full-width grid */}
      <div
        className="hidden gap-2.5 lg:grid lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10"
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
              className={`group flex flex-col gap-1.5 rounded-2xl border-2 p-2 text-left transition-all ${
                active
                  ? "border-pink-400 bg-pink-50 shadow-[0_3px_0_#f9a8d4]"
                  : "border-zinc-200 bg-white shadow-[0_3px_0_#e4e4e7] hover:border-pink-300 active:translate-y-[3px] active:shadow-none"
              } ${disabled ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100">
                <Image
                  src={c.strCategoryThumb}
                  alt=""
                  fill
                  className="object-cover transition group-hover:scale-[1.03]"
                  sizes="(min-width: 1536px) 10vw, (min-width: 1280px) 12vw, 16vw"
                  draggable={false}
                />
              </div>
              <span className={`line-clamp-2 text-center text-[11px] font-bold ${active ? "text-pink-700" : "text-zinc-700"}`}>
                {c.strCategory}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
