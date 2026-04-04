"use client";

import { useRef, useState } from "react";
import type { CrackStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: CrackStep;
  onComplete: (result: StepResult) => void;
};

export function CrackGame({ step, onComplete }: Props) {
  const total = step.count;
  const [cracked, setCracked] = useState(0);
  const [cracking, setCracking] = useState<number | null>(null);
  const completedRef = useRef(false);
  const done = cracked >= total;

  function handleCrack(index: number) {
    if (completedRef.current || index !== cracked) return;

    setCracking(index);
    setTimeout(() => setCracking(null), 400);

    setCracked(prev => {
      const next = prev + 1;
      if (next >= total && !completedRef.current) {
        completedRef.current = true;
        setTimeout(() => {
          onComplete({ perfect: true, message: "Clean cracks, no shell! Well done, chef." });
        }, 600);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Bowl to receive eggs */}
      <div className="flex h-20 w-32 items-center justify-center rounded-b-[3rem] rounded-t-lg border-2 border-edge bg-card shadow-[0_3px_0_var(--edge)]">
        <div className="flex gap-1">
          {Array.from({ length: cracked }).map((_, i) => (
            <span key={i} className="text-lg prep-success-pop" style={{ animationDelay: `${i * 0.1}s` }}>🟡</span>
          ))}
          {cracked === 0 && <span className="text-xs text-muted">empty</span>}
        </div>
      </div>

      {/* Eggs */}
      <div className="flex items-center gap-3">
        {Array.from({ length: total }).map((_, i) => {
          const isCracked = i < cracked;
          const isCracking = cracking === i;
          const isNext = i === cracked;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleCrack(i)}
              disabled={!isNext || done}
              className={`flex h-20 w-16 items-center justify-center rounded-4xl border-2 transition-all sm:h-24 sm:w-20 ${
                isCracked
                  ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10"
                  : isCracking
                    ? "scale-110 border-amber-400 bg-amber-50 dark:bg-amber-900/20 prep-crack-shake"
                    : isNext
                      ? "cursor-pointer border-amber-400 bg-card shadow-[0_3px_0_rgba(180,83,9,0.3)] active:translate-y-0.5 active:shadow-none"
                      : "border-edge bg-surface opacity-50"
              }`}
            >
              {isCracked ? (
                <span className="text-sm text-emerald-500">✓</span>
              ) : isCracking ? (
                <span className="text-3xl prep-crack-split">💥</span>
              ) : (
                <span className="text-3xl">🥚</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-sm font-extrabold text-muted">
        {done ? "All eggs cracked! 🎉" : `Tap egg ${cracked + 1} of ${total}`}
      </p>
    </div>
  );
}
