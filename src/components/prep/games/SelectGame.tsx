"use client";

import { useMemo, useRef, useState } from "react";
import type { SelectStep, StepResult } from "@/lib/gordon/simulation-types";
import { shuffle } from "@/lib/shuffle";

type Props = {
  step: SelectStep;
  onComplete: (result: StepResult) => void;
};

export function SelectGame({ step, onComplete }: Props) {
  const correctNames = useMemo(() => new Set(step.correct.map(c => c.name)), [step.correct]);
  const allItems = useMemo(() => shuffle([...step.correct, ...step.distractors]), [step.correct, step.distractors]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const completedRef = useRef(false);

  const foundCount = [...selected].filter(n => correctNames.has(n)).length;
  const allFound = foundCount === correctNames.size;

  function toggleItem(name: string) {
    if (completedRef.current || allFound) return;

    if (selected.has(name)) {
      setSelected(prev => { const n = new Set(prev); n.delete(name); return n; });
      return;
    }

    if (!correctNames.has(name)) {
      setMistakes(m => m + 1);
      setWrongPick(name);
      setTimeout(() => setWrongPick(null), 600);
      return;
    }

    const next = new Set(selected);
    next.add(name);
    setSelected(next);

    if ([...next].filter(n => correctNames.has(n)).length === correctNames.size && !completedRef.current) {
      completedRef.current = true;
      setTimeout(() => {
        onComplete({
          perfect: mistakes === 0,
          message: mistakes === 0
            ? "Every ingredient, first try! You know your recipe."
            : `Got them all — but watch those wrong picks next time!`,
        });
      }, 600);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-extrabold text-muted">
        {allFound ? "All found! ✨" : `${foundCount} / ${correctNames.size} ingredients found`}
      </p>

      <div className="grid w-full max-w-sm grid-cols-3 gap-2 sm:grid-cols-4">
        {allItems.map((item, idx) => {
          const isSelected = selected.has(item.name);
          const isWrong = wrongPick === item.name;
          const isCorrect = isSelected && correctNames.has(item.name);

          return (
            <button
              key={`${item.name}-${idx}`}
              type="button"
              onClick={() => toggleItem(item.name)}
              disabled={allFound && !isSelected}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-all active:scale-95 ${
                isWrong
                  ? "border-red-400 bg-red-50 dark:bg-red-900/20 prep-wrong-shake"
                  : isCorrect
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-[0_2px_0_rgba(16,185,129,0.4)]"
                    : isSelected
                      ? "border-primary bg-primary-light"
                      : "border-edge bg-card shadow-[0_2px_0_var(--edge)] hover:border-edge-hover"
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[11px] font-extrabold leading-tight text-foreground">{item.name}</span>
              {isCorrect && <span className="text-xs text-emerald-600">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
