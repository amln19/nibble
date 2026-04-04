"use client";

import { useRef, useState } from "react";
import type { SeasonStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: SeasonStep;
  onComplete: (result: StepResult) => void;
};

export function SeasonGame({ step, onComplete }: Props) {
  const target = step.targetPinches;
  const maxPinches = target * 2 + 2;
  const [pinches, setPinches] = useState(0);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  const meterPct = Math.min(100, (pinches / maxPinches) * 100);
  const targetMinPct = Math.max(0, ((target - 1) / maxPinches) * 100);
  const targetMaxPct = Math.min(100, ((target + 1) / maxPinches) * 100);
  const inZone = pinches >= target - 1 && pinches <= target + 1;

  function addPinch() {
    if (done || completedRef.current) return;
    const next = pinches + 1;
    setPinches(next);

    if (next >= maxPinches && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      setTimeout(() => {
        onComplete({ perfect: false, message: "Way too much seasoning! Easy does it next time." });
      }, 500);
    }
  }

  function finish() {
    if (done || completedRef.current) return;
    completedRef.current = true;
    setDone(true);
    const perfect = Math.abs(pinches - target) <= 1;
    setTimeout(() => {
      onComplete({
        perfect,
        message: perfect
          ? "Seasoned to perfection!"
          : pinches < target - 1
            ? "Could use more flavor — don't be shy!"
            : "A bit heavy-handed with the seasoning!",
      });
    }, 500);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Dish */}
      <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)] sm:h-36 sm:w-36">
        <span className="text-4xl">{step.emoji}</span>
        {done && inZone && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-500/10">
            <span className="text-2xl prep-success-pop">✨</span>
          </div>
        )}
      </div>

      {/* Flavor meter */}
      <div className="w-full max-w-xs">
        <div className="relative h-6 w-full overflow-visible rounded-full border-2 border-edge bg-surface">
          {/* Target zone */}
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: `${targetMinPct}%`,
              width: `${targetMaxPct - targetMinPct}%`,
              backgroundColor: "rgba(16,185,129,0.2)",
            }}
          />
          {/* Fill */}
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${meterPct}%`,
              backgroundColor: inZone ? "#10b981" : meterPct > targetMaxPct ? "#ef4444" : "#fbbf24",
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-extrabold text-muted">
          <span>Bland</span>
          <span className="text-emerald-600">Perfect</span>
          <span>Too Much</span>
        </div>
      </div>

      <p className="text-sm font-extrabold text-muted">
        {done ? (inZone ? "Perfect! ✨" : "Done") : `${pinches} pinches`}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={addPinch}
          disabled={done}
          className="tap-3d h-14 w-32 rounded-2xl border-2 border-amber-500 bg-amber-400 text-sm font-black text-stone-900 shadow-[0_4px_0_rgba(180,83,9,0.4)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          {step.spiceEmoji} Pinch
        </button>
        <button
          type="button"
          onClick={finish}
          disabled={done || pinches === 0}
          className="tap-3d h-14 w-32 rounded-2xl border-2 border-emerald-500 bg-emerald-400 text-sm font-black text-white shadow-[0_4px_0_rgba(16,185,129,0.4)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          ✋ Done!
        </button>
      </div>
    </div>
  );
}
