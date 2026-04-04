"use client";

import type { Recipe } from "@/lib/recipes";
import Image from "next/image";
import { useRef, useState } from "react";
import { RecipeInfoSheet } from "./RecipeInfoSheet";

type Props = {
  recipe: Recipe;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

const THRESHOLD = 96;

export function SwipeCard({ recipe, onSwipeLeft, onSwipeRight }: Props) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const latestOffset = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragActive = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const rotation = offset.x * 0.04;
  const passOpacity = Math.min(1, Math.max(0, -offset.x / THRESHOLD));
  const saveOpacity = Math.min(1, Math.max(0, offset.x / THRESHOLD));

  function onPointerDown(e: React.PointerEvent) {
    dragActive.current = true;
    setDragging(true);
    origin.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragActive.current) return;
    const next = {
      x: e.clientX - origin.current.x,
      y: e.clientY - origin.current.y,
    };
    latestOffset.current = next;
    setOffset(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragActive.current) return;
    dragActive.current = false;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
    const { x } = latestOffset.current;
    if (x > THRESHOLD) {
      onSwipeRight();
    } else if (x < -THRESHOLD) {
      onSwipeLeft();
    }
    setOffset({ x: 0, y: 0 });
  }

  return (
    <article
      className="relative w-full max-w-md touch-none select-none rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10 xl:max-w-lg"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
        transition: dragging ? "none" : "transform 0.22s ease-out",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {infoOpen ? (
        <RecipeInfoSheet
          recipe={recipe}
          onClose={() => setInfoOpen(false)}
        />
      ) : null}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
        {recipe.videoUrl ? (
          <video
            className="h-full w-full object-cover"
            src={recipe.videoUrl}
            poster={recipe.imageUrl}
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <Image
            src={recipe.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 40vw, 36rem"
            priority
            draggable={false}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-6 left-6 rounded-lg border-2 border-red-400 px-3 py-1 text-lg font-black tracking-widest text-red-400 uppercase opacity-90"
          style={{ opacity: passOpacity }}
        >
          Pass
        </div>
        <div
          className="pointer-events-none absolute top-6 right-6 rounded-lg border-2 border-emerald-400 px-3 py-1 text-lg font-black tracking-widest text-emerald-400 uppercase opacity-90"
          style={{ opacity: saveOpacity }}
        >
          Save
        </div>
        <button
          type="button"
          className="pointer-events-auto absolute right-4 bottom-24 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white shadow-lg backdrop-blur-md transition hover:bg-black/55 hover:border-white/50 md:bottom-28"
          style={{ touchAction: "manipulation" }}
          aria-label="Recipe details and ingredients"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setInfoOpen(true);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
            aria-hidden
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </button>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 p-6 pr-16 text-white">
          <p className="text-xs font-medium text-white/70">
            {recipe.tagline}
            {recipe.timeMinutes
              ? ` · ${recipe.timeIsEstimate ? "~" : ""}${recipe.timeMinutes} min`
              : ""}
            {recipe.tags.vegan && " · Vegan"}
            {recipe.tags.highProtein && " · High protein"}
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight font-semibold tracking-tight md:text-3xl">
            {recipe.title}
          </h2>
        </div>
      </div>
    </article>
  );
}
