"use client";

import { parseInstructionSteps } from "@/lib/recipe-instruction-steps";

type Props = {
  instructions: string;
  className?: string;
};

export function RecipeInstructionsBlock({
  instructions,
  className = "",
}: Props) {
  const steps = parseInstructionSteps(instructions);
  if (steps.length === 0) return null;

  return (
    <ol
      className={`mt-3 list-none space-y-3 ${className}`.trim()}
      aria-label="Recipe steps"
    >
      {steps.map((step, i) => (
        <li
          key={`${i}-${step.slice(0, 24)}`}
          className="flex gap-3 text-sm leading-relaxed text-foreground/90"
        >
          <span
            className="mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg border-2 border-primary/35 bg-primary/10 text-[11px] font-black tabular-nums text-primary dark:bg-primary/15"
            aria-hidden
          >
            {i + 1}
          </span>
          <span className="min-w-0 pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}
