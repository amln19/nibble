"use client";

import { useEffect, useRef, useState } from "react";
import type { SimmerStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: SimmerStep;
  onComplete: (result: StepResult) => void;
};

export function SimmerGame({ step, onComplete }: Props) {
  const target = step.targetHeat;
  const tolerance = 15;
  const [heat, setHeat] = useState(30);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const heatRef = useRef(30);
  const progressRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      const drift = (Math.random() - 0.45) * 2.5;
      heatRef.current = Math.max(0, Math.min(100, heatRef.current + drift));
      setHeat(heatRef.current);

      const inZone = Math.abs(heatRef.current - target) <= tolerance;
      if (inZone) {
        progressRef.current = Math.min(100, progressRef.current + 1.2);
      } else {
        progressRef.current = Math.max(0, progressRef.current - 0.3);
      }
      setProgress(progressRef.current);

      if (progressRef.current >= 100 && !completedRef.current) {
        completedRef.current = true;
        setDone(true);
        setTimeout(() => {
          onComplete({ perfect: true, message: "Perfectly simmered — patience pays off!" });
        }, 500);
      }
    }, 80);
    return () => clearInterval(id);
  }, [done, target, tolerance, onComplete]);

  function adjustHeat(delta: number) {
    if (done) return;
    heatRef.current = Math.max(0, Math.min(100, heatRef.current + delta));
    setHeat(heatRef.current);
  }

  const inZone = Math.abs(heat - target) <= tolerance;
  const bubbleCount = Math.floor(heat / 25);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pot */}
      <div className="relative flex h-36 w-44 flex-col items-center justify-end overflow-hidden rounded-b-[3rem] rounded-t-xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)] sm:h-40 sm:w-52">
        {heat > 50 && (
          <div className="absolute top-0 left-1/2 flex -translate-x-1/2 gap-2">
            {Array.from({ length: Math.min(3, Math.floor((heat - 50) / 15)) }).map((_, i) => (
              <span key={i} className="prep-smoke text-xs" style={{ animationDelay: `${i * 0.4}s` }}>
                💨
              </span>
            ))}
          </div>
        )}

        <div
          className="mb-0 flex h-20 w-full items-center justify-center gap-1 overflow-hidden rounded-b-[2.8rem] transition-colors"
          style={{ backgroundColor: (heat > 70 ? "#fca5a5" : heat > 40 ? "#fef08a" : "#bfdbfe") + "40" }}
        >
          {Array.from({ length: bubbleCount }).map((_, i) => (
            <span
              key={i}
              className="animate-bounce text-lg"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: heat > 70 ? "0.3s" : "0.6s",
              }}
            >
              ●
            </span>
          ))}
        </div>
      </div>

      {/* Heat gauge */}
      <div className="w-full max-w-xs px-2">
        <div className="relative h-10 w-full">
          <div className="absolute top-1/2 h-3 w-full -translate-y-1/2 overflow-hidden rounded-full border-2 border-edge bg-card">
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: "linear-gradient(to right, #93c5fd, #fef08a, #ef4444)" }}
            />
          </div>

          {/* Target zone */}
          <div
            className="absolute top-1/2 h-7 -translate-y-1/2 rounded-lg border-2 border-dashed border-emerald-500"
            style={{
              left: `${target - tolerance}%`,
              width: `${tolerance * 2}%`,
              backgroundColor: "rgba(16,185,129,0.1)",
            }}
          />

          {/* Current heat */}
          <div
            className={`absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-150 ${
              inZone
                ? "border-emerald-500 bg-emerald-300"
                : heat > target
                  ? "border-red-400 bg-red-300"
                  : "border-blue-400 bg-blue-300"
            }`}
            style={{ left: `${heat}%` }}
          >
            <span className="text-xs">🔥</span>
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-extrabold text-muted">
          <span>Low</span>
          <span className="text-emerald-600">Simmer Zone</span>
          <span>High</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-xs">
        <div className="mb-1 flex justify-between text-xs font-extrabold">
          <span className="text-muted">
            {done ? "Done! ✨" : inZone ? "Simmering nicely…" : heat > target ? "Too hot!" : "Not hot enough"}
          </span>
          <span style={{ color: done ? "#10b981" : "var(--muted)" }}>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full border-2 border-edge bg-surface">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              backgroundColor: done ? "#10b981" : inZone ? "#fbbf24" : "#94a3b8",
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => adjustHeat(-8)}
          disabled={done}
          className="tap-3d h-14 w-28 rounded-2xl border-2 border-blue-400 bg-blue-100 text-sm font-black text-blue-700 shadow-[0_3px_0_rgba(59,130,246,0.3)] transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-40 dark:bg-blue-900/30 dark:text-blue-300"
        >
          ⬇️ Lower
        </button>
        <button
          type="button"
          onClick={() => adjustHeat(8)}
          disabled={done}
          className="tap-3d h-14 w-28 rounded-2xl border-2 border-red-400 bg-red-100 text-sm font-black text-red-700 shadow-[0_3px_0_rgba(239,68,68,0.3)] transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-40 dark:bg-red-900/30 dark:text-red-300"
        >
          ⬆️ Higher
        </button>
      </div>
    </div>
  );
}
