"use client";

import type { Recipe } from "@/lib/recipes";
import Image from "next/image";
import { useRef, useState } from "react";
import { RecipeInfoSheet } from "./RecipeInfoSheet";
import { Clock, Leaf, Dumbbell, Info } from "lucide-react";

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
      className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)]"
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
      <div className="relative aspect-3/4 w-full overflow-hidden lg:max-h-[320px]">
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
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent"
          aria-hidden
        />

        {/* Swipe indicators */}
        <div
          className="pointer-events-none absolute top-6 left-6 rounded-xl border-2 border-white/60 bg-white/20 px-3 py-1.5 text-sm font-black tracking-widest text-white uppercase backdrop-blur-sm"
          style={{ opacity: passOpacity }}
        >
          Pass
        </div>
        <div
          className="pointer-events-none absolute top-6 right-6 rounded-xl border-2 border-primary bg-primary/30 px-3 py-1.5 text-sm font-black tracking-widest text-white uppercase backdrop-blur-sm"
          style={{ opacity: saveOpacity }}
        >
          Save ❤️
        </div>

        {/* Info button */}
        <button
          type="button"
          className="pointer-events-auto absolute right-4 bottom-4 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/20 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
          style={{ touchAction: "manipulation" }}
          aria-label="Recipe details and ingredients"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setInfoOpen(true);
          }}
        >
          <Info className="h-5 w-5" />
        </button>

        {/* Recipe info overlay */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 p-5 pr-16 pb-16">
          <div className="flex flex-wrap gap-1.5">
            {recipe.timeMinutes ? (
              <span className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-extrabold text-white backdrop-blur-sm">
                <Clock className="h-3 w-3" /> {recipe.timeIsEstimate ? "~" : ""}{recipe.timeMinutes} min
              </span>
            ) : null}
            {recipe.tags.vegan && (
              <span className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-extrabold text-white backdrop-blur-sm">
                <Leaf className="h-3 w-3" /> Vegan
              </span>
            )}
            {recipe.tags.highProtein && (
              <span className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-extrabold text-white backdrop-blur-sm">
                <Dumbbell className="h-3 w-3" /> Protein
              </span>
            )}
          </div>
          <h2 className="mt-2 text-2xl leading-tight font-extrabold tracking-tight text-white md:text-3xl">
            {recipe.title}
          </h2>
          <p className="mt-1 text-xs font-bold text-white/70">
            {recipe.tagline}
          </p>
        </div>
      </div>
    </article>
  );
}
