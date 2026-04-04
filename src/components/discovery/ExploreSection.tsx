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
};

export function ExploreSection({
  categories,
  selected,
  onSelect,
  disabled,
}: Props) {
  return (
    <section className="w-full" aria-labelledby="explore-heading">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="explore-heading"
            className="font-serif text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl dark:text-zinc-50"
          >
            Explore
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Browse by course and cuisine-style categories — then swipe recipes
            from the live{" "}
            <a
              href="https://www.themealdb.com/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              TheMealDB
            </a>{" "}
            catalog.
          </p>
        </div>
      </div>

      {/* Mobile / tablet: horizontal scroll */}
      <div className="-mx-1 lg:hidden">
        <div
          className="flex gap-3 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
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
                className={`flex w-[7.25rem] shrink-0 snap-center flex-col gap-2 rounded-2xl border p-2 text-left transition ${
                  active
                    ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                } ${disabled ? "opacity-50" : ""}`}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={c.strCategoryThumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                    draggable={false}
                  />
                </div>
                <span className="line-clamp-2 text-center text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {c.strCategory}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: full-width grid */}
      <div
        className="hidden gap-3 lg:grid lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10"
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
              className={`group flex flex-col gap-2 rounded-2xl border p-2 text-left transition ${
                active
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40"
                  : "border-zinc-200 bg-white hover:border-emerald-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
              } ${disabled ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={c.strCategoryThumb}
                  alt=""
                  fill
                  className="object-cover transition group-hover:scale-[1.03]"
                  sizes="(min-width: 1536px) 10vw, (min-width: 1280px) 12vw, 16vw"
                  draggable={false}
                />
              </div>
              <span className="line-clamp-2 text-center text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {c.strCategory}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
