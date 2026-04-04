"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TimerStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: TimerStep;
  onComplete: (result: StepResult) => void;
};

function getCakeVisual(progress: number) {
  if (progress < 20) return { color: "#fef3c7", height: 30, label: "Raw batter", emoji: "🫠" };
  if (progress < 40) return { color: "#fde68a", height: 45, label: "Starting to rise…", emoji: "🍞" };
  if (progress < 55) return { color: "#fcd34d", height: 60, label: "Rising nicely!", emoji: "🍞" };
  if (progress < 72) return { color: "#f59e0b", height: 70, label: "Golden perfection!", emoji: "🎂" };
  if (progress < 85) return { color: "#c2410c", height: 68, label: "Getting dark…", emoji: "🫣" };
  return { color: "#451a03", height: 62, label: "Burning!", emoji: "💨" };
}

export function BakeGame({ step, onComplete }: Props) {
  const target = step.targetPercent;
  const zoneTolerance = 12;
  const [progress, setProgress] = useState(0);
  const [tapped, setTapped] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (tapped) return;
    const id = setInterval(() => {
      setProgress(prev => {
        const next = prev + 0.55;
        if (next >= 100 && !completedRef.current) {
          completedRef.current = true;
          setTimeout(() => {
            onComplete({ perfect: false, message: "It burned! Pull it out sooner — watch for golden color." });
          }, 500);
          return 100;
        }
        return next;
      });
    }, 60);
    return () => clearInterval(id);
  }, [tapped, onComplete]);

  const handleTap = useCallback(() => {
    if (tapped || completedRef.current) return;
    setTapped(true);
    completedRef.current = true;

    const distance = Math.abs(progress - target);
    const inZone = distance <= zoneTolerance;
    const perfect = distance <= 5;

    setTimeout(() => {
      onComplete({
        perfect,
        message: perfect
          ? "Perfect timing — golden brown perfection!"
          : inZone
            ? "Good timing! Just slightly off from perfect."
            : progress < target
              ? "Too early! It needed more time to rise and set."
              : "Too late — it's starting to overcook.",
      });
    }, 500);
  }, [tapped, progress, target, zoneTolerance, onComplete]);

  const cake = getCakeVisual(progress);
  const done = tapped || progress >= 100;
  const inPerfectZone = progress >= target - zoneTolerance && progress <= target + zoneTolerance;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Oven window */}
      <div className="relative flex h-44 w-56 items-end justify-center overflow-hidden rounded-2xl border-2 border-edge bg-stone-800 shadow-[0_4px_0_var(--edge)] sm:h-52 sm:w-64">
        {/* Oven interior glow */}
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at bottom, ${cake.color}20, transparent 70%)`,
        }} />

        {/* Oven glass tint */}
        <div className="absolute inset-0 bg-amber-900/10" />

        {/* Cake */}
        <div
          className="relative mx-8 mb-4 w-3/4 rounded-t-2xl transition-all duration-300"
          style={{
            height: `${cake.height}%`,
            backgroundColor: cake.color,
            boxShadow: `0 -4px 12px ${cake.color}40`,
          }}
        >
          {progress >= 80 && !tapped && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-2">
              {[0, 1].map(i => (
                <span key={i} className="prep-smoke text-sm" style={{ animationDelay: `${i * 0.5}s` }}>💨</span>
              ))}
            </div>
          )}
        </div>

        {/* Window frame */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-stone-600" />

        {/* Status label */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-lg bg-stone-900/70 px-3 py-1 backdrop-blur-sm">
          <span className="text-xs font-extrabold text-stone-200">
            {cake.emoji} {cake.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="relative h-3 w-full overflow-visible rounded-full border-2 border-edge bg-surface">
          {/* Perfect zone */}
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: `${target - zoneTolerance}%`,
              width: `${zoneTolerance * 2}%`,
              backgroundColor: "rgba(16,185,129,0.25)",
            }}
          />
          {/* Progress */}
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{ width: `${progress}%`, backgroundColor: cake.color }}
          />
        </div>
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={handleTap}
        disabled={done}
        className={`tap-3d h-16 w-48 rounded-2xl border-2 text-base font-black transition-all ${
          done
            ? "border-edge bg-surface text-muted"
            : inPerfectZone
              ? "border-emerald-600 bg-emerald-500 text-white shadow-[0_4px_0_rgba(16,185,129,0.5)] active:translate-y-1 active:shadow-none prep-heat-glow"
              : "border-primary-dark bg-primary text-white shadow-[0_4px_0_var(--primary-dark)] active:translate-y-1 active:shadow-none"
        }`}
      >
        {done ? (tapped ? "✓ Pulled!" : "✗ Burnt!") : "🎂 TAKE IT OUT!"}
      </button>

      {!done && (
        <p className="text-xs font-extrabold text-muted">Pull it out when it looks perfectly golden!</p>
      )}
    </div>
  );
}
