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
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            In your recipe box
          </h2>
          <p className="text-xs text-muted">
            Saved on this device — manage anytime in{" "}
            <Link
              href="/box"
              className="font-bold text-primary-dark underline-offset-2 hover:underline"
            >
              Recipe box
            </Link>
          </p>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recipes.map((r) => (
          <div
            key={r.id}
            className="group relative w-28 shrink-0 sm:w-32"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-edge bg-card shadow-sm transition hover:border-primary/50">
              <Link href="/box" className="block">
                <div className="relative aspect-square w-full">
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
                <p className="line-clamp-2 px-2 py-2 text-[11px] font-semibold leading-tight text-foreground">
                  {r.title}
                </p>
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
