"use client";

import { useRef, useState } from "react";
import type { MixStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: MixStep;
  onComplete: (result: StepResult) => void;
};

export function MixGame({ step, onComplete }: Props) {
  const target = step.targetTaps;
  const [taps, setTaps] = useState(0);
  const [wobble, setWobble] = useState(false);
  const completedRef = useRef(false);

  const progress = Math.min(100, (taps / target) * 100);
  const done = taps >= target;

  const stageLabel =
    progress < 30 ? "Chunky" : progress < 60 ? "Combining…" : progress < 90 ? "Almost there…" : step.resultLabel;

  const stageColor =
    progress < 30 ? "#fef3c7" : progress < 60 ? "#fde68a" : progress < 90 ? "#fcd34d" : "#fbbf24";

  function handleTap() {
    if (completedRef.current) return;

    setWobble(true);
    setTimeout(() => setWobble(false), 150);

    setTaps(prev => {
      const next = prev + 1;
      if (next >= target && !completedRef.current) {
        completedRef.current = true;
        setTimeout(() => {
          onComplete({ perfect: true, message: `${step.resultLabel} — beautifully mixed!` });
        }, 600);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Bowl */}
      <div
        className={`relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-edge shadow-[0_4px_0_var(--edge)] transition-transform sm:h-40 sm:w-40 ${
          wobble ? "prep-mix-wobble" : ""
        }`}
        style={{ backgroundColor: stageColor + "40" }}
      >
        {/* Contents */}
        <div
          className="absolute inset-4 rounded-full transition-all duration-300"
          style={{
            backgroundColor: stageColor,
            opacity: 0.6,
            filter: `blur(${Math.max(0, 8 - progress / 12)}px)`,
          }}
        />
        <span className="relative text-4xl">{step.emoji}</span>

        {/* Done overlay */}
        {done && (
          <div className="prep-success-pop absolute inset-0 flex items-center justify-center rounded-full bg-emerald-500/20 backdrop-blur-sm">
            <span className="text-3xl">✅</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="w-full max-w-xs">
        <div className="mb-2 flex justify-between text-xs font-extrabold">
          <span className="text-muted">{stageLabel}</span>
          <span style={{ color: done ? "#10b981" : "var(--muted)" }}>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full border-2 border-edge bg-surface">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{ width: `${progress}%`, backgroundColor: done ? "#10b981" : stageColor }}
          />
        </div>
      </div>

      {/* Mix button */}
      <button
        type="button"
        onClick={handleTap}
        disabled={done}
        className="tap-3d h-16 w-44 rounded-2xl border-2 border-amber-500 bg-amber-400 text-sm font-black text-stone-900 shadow-[0_4px_0_rgba(180,83,9,0.4)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-40"
      >
        {done ? "✓ Mixed!" : "🥄 Mix!"}
      </button>
    </div>
  );
}
