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
          <h2 className="font-serif text-lg font-semibold text-zinc-900">
            Recommended for you
          </h2>
          <p className="text-xs text-zinc-500">
            Based on what you liked this session
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-rose-600 shadow-sm transition hover:bg-rose-50 active:scale-95"
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
            className="group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={r.imageUrl}
                alt={r.title}
                fill
                sizes="160px"
                className="object-cover transition group-hover:scale-105"
              />
              <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-rose-600 shadow-sm">
                {Math.round(r.score * 100)}% match
              </span>
            </div>

            <div className="flex flex-1 flex-col p-2.5">
              <p className="line-clamp-2 text-sm font-medium leading-tight text-zinc-800">
                {r.title}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {r.category}{r.area ? ` · ${r.area}` : ""}
              </p>

              <button
                type="button"
                onClick={() => onSave(r)}
                className="mt-2 w-full rounded-lg bg-rose-500 py-1.5 text-xs font-medium text-white transition hover:bg-rose-600 active:scale-95"
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
