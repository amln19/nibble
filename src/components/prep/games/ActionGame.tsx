"use client";

import { useEffect, useRef, useState } from "react";
import type { ActionStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: ActionStep;
  onComplete: (result: StepResult) => void;
};

const READ_TIME_MS = 2000;
const TICK_MS = 30;

export function ActionGame({ step, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (READ_TIME_MS / TICK_MS));
        if (next >= 100) {
          setReady(true);
          return 100;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [ready]);

  function handleContinue() {
    if (!ready || completedRef.current) return;
    completedRef.current = true;
    setDone(true);
    setTimeout(() => {
      onComplete({ perfect: true, message: "Step noted — onward, chef!" });
    }, 300);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Instruction card */}
      <div className="w-full max-w-sm rounded-3xl border-2 border-edge bg-card px-6 py-5 shadow-[0_4px_0_var(--edge)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-3xl">{step.emoji}</span>
          <div>
            <p className="text-base font-extrabold leading-snug text-foreground">
              {step.instruction}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{step.tip}</p>
          </div>
        </div>
      </div>

      {/* Reading progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-2 w-full overflow-hidden rounded-full border border-edge bg-surface">
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${progress}%`,
              backgroundColor: ready ? "#10b981" : "var(--accent)",
            }}
          />
        </div>
      </div>

      {/* Continue button — only enabled after reading timer */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!ready || done}
        className={`tap-3d h-14 w-48 rounded-2xl border-2 text-sm font-black transition-all ${
          done
            ? "border-edge bg-surface text-muted"
            : ready
              ? "border-accent bg-accent text-white shadow-[0_4px_0_rgba(124,92,252,0.5)] active:translate-y-1 active:shadow-none"
              : "border-edge bg-surface text-muted"
        }`}
      >
        {done ? "✓ Done!" : ready ? "Continue →" : "Reading…"}
      </button>
    </div>
  );
}
