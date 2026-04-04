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
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-lg font-extrabold text-foreground">
            In your recipe box
          </h2>
          <p className="max-w-md text-xs leading-relaxed text-muted">
            Saved on this device. Manage anytime in{" "}
            <Link
              href="/box"
              className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 transition hover:decoration-primary"
            >
              Recipe box
            </Link>
            .
          </p>
        </div>
        <Link
          href="/box"
          className="shrink-0 rounded-full border-2 border-edge bg-card px-3 py-1.5 text-xs font-extrabold text-muted shadow-sm transition hover:border-primary hover:text-foreground active:scale-95"
        >
          View all
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
                <div className="flex min-h-[2.75rem] min-w-0 flex-1 items-start px-2 py-2">
                  <p className="line-clamp-2 w-full break-words text-[11px] font-semibold leading-snug text-foreground">
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
