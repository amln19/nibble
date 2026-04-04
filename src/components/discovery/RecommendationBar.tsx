"use client";

import type { Recipe } from "@/lib/recipes";
import type { ScoredRecipe } from "@/lib/recommend";
import Image from "next/image";

type Props = {
  recommendations: ScoredRecipe[];
  onSave: (recipe: Recipe) => void;
  onRefresh?: () => void;
};

export function RecommendationBar({ recommendations, onSave, onRefresh }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Recommended for you
          </h2>
          <p className="text-xs text-muted">
            Based on what you liked this session
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-full border-2 border-edge bg-card px-3 py-1.5 text-xs font-extrabold text-muted shadow-sm transition hover:border-primary hover:text-foreground active:scale-95"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            Refresh
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
        {recommendations.map((r) => (
          <div
            key={r.id}
            className="group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-edge bg-card shadow-sm transition hover:border-primary/50 hover:shadow-md"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={r.imageUrl}
                alt={r.title}
                fill
                sizes="160px"
                className="object-cover transition group-hover:scale-105"
              />
              <span className="absolute top-2 left-2 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-extrabold text-primary shadow-sm">
                {Math.round(r.score * 100)}% match
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-2.5">
              <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-foreground">
                {r.title}
              </p>
              <p className="mt-1 line-clamp-2 break-words text-[11px] font-medium leading-snug text-muted">
                {r.category}{r.area ? ` · ${r.area}` : ""}
              </p>

              <button
                type="button"
                onClick={() => onSave(r)}
                className="mt-2 w-full rounded-xl border-2 border-primary-dark bg-primary py-1.5 text-xs font-extrabold text-white shadow-[0_2px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none"
              >
                Save ♥
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
