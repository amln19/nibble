"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PourStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: PourStep;
  onComplete: (result: StepResult) => void;
};

export function PourGame({ step, onComplete }: Props) {
  const target = step.targetLevel;
  const tolerance = 12;
  const [level, setLevel] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [locked, setLocked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!pouring || locked) return;
    intervalRef.current = setInterval(() => {
      setLevel(prev => {
        const next = Math.min(100, prev + 1.0 + prev * 0.006);
        levelRef.current = next;
        if (next >= 100) { setPouring(false); setLocked(true); }
        return next;
      });
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pouring, locked]);

  useEffect(() => {
    if (!locked || completedRef.current) return;
    completedRef.current = true;
    const distance = Math.abs(levelRef.current - target);
    const perfect = distance <= 5;
    const inZone = distance <= tolerance;
    const timer = setTimeout(() => {
      onComplete({
        perfect,
        message: perfect
          ? "Measured perfectly — precision pouring!"
          : inZone
            ? "Close enough — good instincts!"
            : levelRef.current > target
              ? "A bit too much! Pour slower next time."
              : "Not quite enough — hold a touch longer.",
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [locked, target, tolerance, onComplete]);

  const startPour = useCallback(() => { if (!locked) setPouring(true); }, [locked]);
  const stopPour = useCallback(() => {
    if (locked) return;
    setPouring(false);
    if (levelRef.current > 5) setLocked(true);
  }, [locked]);

  const inZone = locked && Math.abs(level - target) <= tolerance;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-end gap-6">
        {/* Source ingredient */}
        <div className="flex flex-col items-center gap-1">
          <span className={`text-5xl transition-transform duration-200 ${pouring ? "-rotate-45 translate-x-4" : ""}`}>
            {step.ingredientEmoji}
          </span>
          <span className="text-xs font-extrabold text-muted">{step.ingredient}</span>
        </div>

        {/* Bowl */}
        <div className="relative h-44 w-28">
          <div className="absolute bottom-0 h-36 w-28 overflow-hidden rounded-b-4xl rounded-t-lg border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)]">
            {/* Target line */}
            <div className="absolute right-0 left-0 border-t-2 border-dashed border-primary" style={{ bottom: `${target}%` }} />

            {/* Liquid */}
            <div
              className="absolute right-0 bottom-0 left-0 rounded-b-[1.8rem] transition-all duration-75"
              style={{ height: `${level}%`, backgroundColor: step.ingredientEmoji === "🍋" ? "#fef08a" : "#fde68a", opacity: 0.7 }}
            >
              {pouring && (
                <div className="absolute top-0 right-0 left-0 h-2 rounded-full opacity-50" style={{ backgroundColor: "#fbbf24", animation: "prep-wave 0.5s ease-in-out infinite" }} />
              )}
            </div>
          </div>

          {/* Pour stream */}
          {pouring && (
            <div className="prep-pour-stream absolute top-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full" style={{ height: "20%", backgroundColor: "#fbbf24", opacity: 0.5 }} />
          )}
        </div>
      </div>

      {/* Status */}
      <p className="text-sm font-extrabold" style={{ color: locked ? (inZone ? "#10b981" : "#f59e0b") : "var(--muted)" }}>
        {locked ? (inZone ? "Just right! ✨" : level > target ? "Too much!" : "Not enough") : pouring ? "Pouring…" : "Hold to pour"}
      </p>

      <button
        type="button"
        onPointerDown={startPour}
        onPointerUp={stopPour}
        onPointerLeave={stopPour}
        disabled={locked}
        className={`tap-3d h-16 w-44 select-none rounded-2xl border-2 text-sm font-black transition-all ${
          locked
            ? "border-edge bg-surface text-muted"
            : pouring
              ? "translate-y-0.5 border-primary-dark bg-primary text-white shadow-[0_2px_0_var(--primary-dark)]"
              : "border-primary-dark bg-primary text-white shadow-[0_4px_0_var(--primary-dark)] active:translate-y-1 active:shadow-none"
        }`}
      >
        {locked ? (inZone ? "✓ Done" : "✗ Done") : pouring ? "Pouring…" : `🫗 Hold to Pour`}
      </button>
    </div>
  );
}
