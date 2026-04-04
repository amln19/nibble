"use client";

import type { Recipe } from "@/lib/recipes";
import Image from "next/image";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { RecipeInfoSheet } from "./RecipeInfoSheet";
import { Clock, Leaf, Dumbbell, Info } from "lucide-react";

type Props = {
  recipe: Recipe;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

export type SwipeCardHandle = {
  triggerFly: (direction: "left" | "right") => void;
};

const THRESHOLD = 96;
const FLY_DISTANCE = 600;

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(
  function SwipeCard({ recipe, onSwipeLeft, onSwipeRight }, ref) {
    const [infoOpen, setInfoOpen] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const latestOffset = useRef({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [flyingOff, setFlyingOff] = useState<"left" | "right" | null>(null);
    const dragActive = useRef(false);
    const origin = useRef({ x: 0, y: 0 });

    const rotation = offset.x * 0.04;
    const passOpacity = Math.min(1, Math.max(0, -offset.x / THRESHOLD));
    const saveOpacity = Math.min(1, Math.max(0, offset.x / THRESHOLD));
    const saveProgress = Math.min(1, Math.max(0, offset.x / (THRESHOLD * 1.2)));
    const passProgress = Math.min(1, Math.max(0, -offset.x / (THRESHOLD * 1.2)));

    function flyOff(direction: "left" | "right") {
      if (flyingOff) return;
      setFlyingOff(direction);
      setOffset({
        x: direction === "right" ? FLY_DISTANCE : -FLY_DISTANCE,
        y: -40,
      });
      setTimeout(direction === "right" ? onSwipeRight : onSwipeLeft, 280);
    }

    useImperativeHandle(ref, () => ({ triggerFly: flyOff }));

    function onPointerDown(e: React.PointerEvent) {
      if (flyingOff) return;
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
        flyOff("right");
      } else if (x < -THRESHOLD) {
        flyOff("left");
      } else {
        setOffset({ x: 0, y: 0 });
      }
    }

    const isFlying = flyingOff !== null;
    const flyRotation = flyingOff === "right" ? 18 : flyingOff === "left" ? -18 : rotation;

    const borderColor =
      saveProgress > 0.05
        ? `rgba(255,75,140,${0.3 + saveProgress * 0.7})`
        : passProgress > 0.05
          ? `rgba(120,120,140,${0.3 + passProgress * 0.7})`
          : "var(--edge)";

    const boxShadow =
      saveProgress > 0.05
        ? `0 4px 0 rgba(255,75,140,${0.4 + saveProgress * 0.6}), 0 0 ${saveProgress * 24}px rgba(255,75,140,${saveProgress * 0.5})`
        : passProgress > 0.05
          ? `0 4px 0 rgba(120,120,140,${0.3 + passProgress * 0.5}), 0 0 ${passProgress * 16}px rgba(120,120,140,${passProgress * 0.3})`
          : "0 4px 0 var(--edge)";

    return (
      <article
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 bg-card"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${isFlying ? flyRotation : rotation}deg)`,
          transition: dragging ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
          opacity: isFlying ? 0 : 1,
          touchAction: "none",
          borderColor,
          boxShadow,
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
          {/* Save tint overlay */}
          {saveProgress > 0 && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: `rgba(255,75,140,${saveProgress * 0.25})` }}
              aria-hidden
            />
          )}
          {/* Pass tint overlay */}
          {passProgress > 0 && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: `rgba(0,0,0,${passProgress * 0.3})` }}
              aria-hidden
            />
          )}

          {/* Swipe indicators */}
          <div
            className="pointer-events-none absolute top-6 left-6 rounded-xl border-2 border-white px-4 py-2 text-base font-black tracking-widest text-white uppercase shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            style={{
              opacity: passOpacity,
              backgroundColor: `rgba(80,80,100,${0.7 + passProgress * 0.3})`,
              transform: `scale(${0.9 + passProgress * 0.15})`,
            }}
          >
            {passProgress >= 0.85 ? "✕ Pass" : "Pass"}
          </div>
          <div
            className="pointer-events-none absolute top-6 right-6 rounded-xl border-2 border-white px-4 py-2 text-base font-black tracking-widest text-white uppercase shadow-[0_4px_16px_rgba(255,75,140,0.6)]"
            style={{
              opacity: saveOpacity,
              backgroundColor: `rgba(255,75,140,${0.75 + saveProgress * 0.25})`,
              transform: `scale(${0.9 + saveProgress * 0.15})`,
            }}
          >
            {saveProgress >= 0.85 ? "✓ Saved!" : "Save ❤️"}
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
  },
);
