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
          <h2 className="font-serif text-lg font-semibold text-zinc-900">
            In your recipe box
          </h2>
          <p className="text-xs text-zinc-500">
            Saved on this device — manage anytime in{" "}
            <Link
              href="/box"
              className="font-medium text-rose-600 underline-offset-2 hover:underline"
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
            <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
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
                    <div className="flex h-full items-center justify-center bg-rose-50 text-[10px] text-zinc-400">
                      No image
                    </div>
                  )}
                </div>
                <p className="line-clamp-2 px-2 py-2 text-[11px] font-medium leading-tight text-zinc-800">
                  {r.title}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => onRemove(r.id)}
                className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs text-zinc-500 shadow-md ring-1 ring-rose-100/80 transition hover:bg-rose-50 hover:text-rose-700"
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
