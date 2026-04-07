"use client";

import { useRef, useState } from "react";
import type {
  TemperatureStep,
  StepResult,
} from "@/lib/gordon/simulation-types";

type Props = {
  step: TemperatureStep;
  onComplete: (result: StepResult) => void;
};

function getTempRange(unit: string, target: number) {
  if (unit === "°F") {
    const min = Math.max(150, Math.floor((target - 100) / 50) * 50);
    const max = min + 250;
    return { min, max };
  }
  const min = Math.max(80, Math.floor((target - 60) / 20) * 20);
  const max = min + 150;
  return { min, max };
}

export function OvenGame({ step, onComplete }: Props) {
  const target = step.targetTemp;
  const tolerance = step.tolerance;
  const { min: MIN_TEMP, max: MAX_TEMP } = getTempRange(step.unit, target);
  const [temp, setTemp] = useState(() => {
    const offset = target > MIN_TEMP + 30 ? -40 : 30;
    return Math.max(MIN_TEMP, Math.min(MAX_TEMP, target + offset));
  });
  const [locked, setLocked] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const range = MAX_TEMP - MIN_TEMP;
  const pct = ((temp - MIN_TEMP) / range) * 100;
  const targetPct = ((target - MIN_TEMP) / range) * 100;
  const tolerancePct = (tolerance / range) * 100;
  const inZone = Math.abs(temp - target) <= tolerance;

  function updateTemp(clientX: number) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setTemp(Math.round(MIN_TEMP + p * range));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (locked) return;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateTemp(e.clientX);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    updateTemp(e.clientX);
  }

  function onPointerUp(e: React.PointerEvent) {
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
  }

  function handleSet() {
    if (locked || completedRef.current) return;
    setLocked(true);
    completedRef.current = true;

    const distance = Math.abs(temp - target);
    const perfect = distance <= tolerance / 2;

    setTimeout(() => {
      onComplete({
        perfect,
        message: perfect
          ? `${temp}${step.unit} — spot on!`
          : inZone
            ? `${temp}${step.unit} — close enough, it'll work!`
            : temp > target
              ? `${temp}${step.unit} — too hot! The cake will burn outside.`
              : `${temp}${step.unit} — too cold! The cake won't rise properly.`,
      });
    }, 600);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Oven display */}
      <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-edge bg-surface px-8 py-5 shadow-[0_4px_0_var(--edge)]">
        <span className="text-xs font-extrabold uppercase tracking-widest text-muted">
          Oven Temperature
        </span>
        <span
          className={`font-mono text-4xl font-black tabular-nums ${
            locked
              ? inZone
                ? "text-emerald-600"
                : "text-red-500"
              : "text-foreground"
          }`}
        >
          {temp}
          {step.unit}
        </span>
        <span className="text-xs font-bold text-primary-dark">
          Target: {target}
          {step.unit}
        </span>
      </div>

      {/* Temperature slider */}
      <div className="w-full max-w-xs px-2">
        <div
          ref={trackRef}
          className="relative h-12 w-full cursor-pointer touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Track */}
          <div className="absolute top-1/2 h-3 w-full -translate-y-1/2 overflow-hidden rounded-full border-2 border-edge bg-card">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background:
                  "linear-gradient(to right, #93c5fd, #fbbf24 40%, #fbbf24 60%, #ef4444)",
              }}
            />
          </div>

          {/* Target zone */}
          <div
            className="absolute top-1/2 h-7 -translate-y-1/2 rounded-lg border-2 border-dashed border-emerald-500"
            style={{
              left: `${targetPct - tolerancePct}%`,
              width: `${tolerancePct * 2}%`,
              backgroundColor: "rgba(16,185,129,0.1)",
            }}
          />

          {/* Thumb */}
          <div
            className={`absolute top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg transition-colors ${
              locked
                ? inZone
                  ? "border-emerald-500 bg-emerald-400"
                  : "border-red-400 bg-red-300"
                : inZone
                  ? "border-emerald-500 bg-emerald-300"
                  : "border-edge bg-card"
            }`}
            style={{ left: `${pct}%` }}
          />
        </div>

        <div className="mt-1 flex justify-between text-[10px] font-extrabold text-muted">
          <span>
            {MIN_TEMP}
            {step.unit}
          </span>
          <span>
            {MAX_TEMP}
            {step.unit}
          </span>
        </div>
      </div>

      {/* SET button */}
      <button
        type="button"
        onClick={handleSet}
        disabled={locked}
        className={`tap-3d h-14 w-44 rounded-2xl border-2 text-sm font-black transition-all ${
          locked
            ? "border-edge bg-surface text-muted"
            : inZone
              ? "border-emerald-600 bg-emerald-500 text-white shadow-[0_4px_0_rgba(16,185,129,0.5)] active:translate-y-1 active:shadow-none"
              : "border-amber-500 bg-amber-400 text-stone-900 shadow-[0_4px_0_rgba(180,83,9,0.4)] active:translate-y-1 active:shadow-none"
        }`}
      >
        {locked ? (inZone ? "✓ Set!" : "✗ Set") : "🔥 SET OVEN"}
      </button>
    </div>
  );
}
