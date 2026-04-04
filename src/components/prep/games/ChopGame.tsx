"use client";

import { useRef, useState } from "react";
import type { ChopStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: ChopStep;
  onComplete: (result: StepResult) => void;
};

export function ChopGame({ step, onComplete }: Props) {
  const target = step.targetChops;
  const [chops, setChops] = useState(0);
  const [knifeDown, setKnifeDown] = useState(false);
  const completedRef = useRef(false);

  const progress = Math.min(100, (chops / target) * 100);
  const done = chops >= target;

  function handleChop() {
    if (completedRef.current) return;

    setKnifeDown(true);
    setTimeout(() => setKnifeDown(false), 100);

    setChops(prev => {
      const next = prev + 1;
      if (next >= target && !completedRef.current) {
        completedRef.current = true;
        setTimeout(() => {
          onComplete({ perfect: true, message: "Chopped to perfection!" });
        }, 500);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Cutting board */}
      <div
        className="relative flex h-36 w-56 cursor-pointer touch-none select-none flex-col items-center justify-center rounded-2xl border-2 border-amber-700/30 bg-amber-100 shadow-[0_4px_0_rgba(120,53,15,0.3)] active:translate-y-0.5 active:shadow-[0_2px_0_rgba(120,53,15,0.3)] dark:bg-amber-900/30 sm:h-40 sm:w-64"
        onClick={handleChop}
      >
        <span className={`text-5xl transition-transform duration-75 ${knifeDown ? "scale-90" : ""}`}>
          {step.emoji}
        </span>
        <span className="mt-1 text-xs font-extrabold text-amber-900 dark:text-amber-300">
          {step.ingredient}
        </span>

        {/* Knife */}
        <div
          className={`absolute -right-4 top-2 text-4xl transition-all duration-75 ${
            knifeDown ? "translate-y-2 rotate-0" : "-translate-y-1 -rotate-12"
          }`}
        >
          🔪
        </div>

        {done && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/10">
            <span className="text-2xl prep-success-pop">✅</span>
          </div>
        )}
      </div>

      <p className="text-sm font-extrabold text-muted">
        {done ? "Perfectly chopped! ✨" : `Tap to chop! ${chops}/${target}`}
      </p>

      <div className="w-full max-w-xs">
        <div className="h-2.5 w-full overflow-hidden rounded-full border-2 border-edge bg-surface">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{ width: `${progress}%`, backgroundColor: done ? "#10b981" : "#f59e0b" }}
          />
        </div>
      </div>
    </div>
  );
}
