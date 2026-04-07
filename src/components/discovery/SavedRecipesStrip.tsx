"use client";

import type { Recipe } from "@/lib/recipes";
import Image from "next/image";
import Link from "next/link";

type Props = {
  recipes: readonly Recipe[];
  onRemove: (id: string) => void;
};

export function SavedRecipesStrip({ recipes, onRemove }: Props) {
  if (recipes.length === 0) return null;

  return (
    <section className="mt-12 mb-6 lg:mt-16">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="min-w-0 text-lg font-extrabold text-foreground">
          In your recipe box
        </h2>
        <Link
          href="/box"
          className="tap-3d inline-flex shrink-0 items-center justify-center rounded-2xl border-2 border-primary bg-primary-light px-4 py-2.5 text-xs font-extrabold text-primary-dark shadow-[0_3px_0_var(--primary)] transition hover:brightness-[1.03] active:translate-y-0.5 active:shadow-none"
        >
          Go to Recipe Box
        </Link>
      </div>
      <div className="flex gap-3.5 overflow-x-auto pb-2">
        {recipes.map((r) => (
          <div
            key={r.id}
            className="group relative w-28 shrink-0 self-stretch sm:w-32"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-edge bg-card shadow-sm transition hover:border-primary/50">
              <Link href="/box" className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <div className="relative aspect-square w-full shrink-0 overflow-hidden">
                  {r.imageUrl ? (
                    <Image
                      src={r.imageUrl}
                      alt={r.title}
                      fill
                      sizes="128px"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-surface text-[10px] text-muted">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex min-h-11 min-w-0 flex-1 items-start px-2 py-2">
                  <p className="line-clamp-2 w-full break-anywhere text-[11px] font-semibold leading-snug text-foreground">
                    {r.title}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => onRemove(r.id)}
                className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card/95 text-xs text-muted shadow-md ring-2 ring-edge transition-all hover:text-red-500 hover:ring-red-400 active:scale-95"
                aria-label={`Remove ${r.title} from recipe box`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
