"use client";

import type { Recipe } from "@/lib/recipes";
import type { RecipeSimulation, StepResult } from "@/lib/gordon/simulation-types";
import { getSimulation } from "@/lib/gordon/recipes";
import { GordonAvatar } from "@/components/companion/GordonAvatar";
import { DragGame } from "./games/DragGame";
import { SelectGame } from "./games/SelectGame";
import { PourGame } from "./games/PourGame";
import { MixGame } from "./games/MixGame";
import { CrackGame } from "./games/CrackGame";
import { OvenGame } from "./games/OvenGame";
import { BakeGame } from "./games/BakeGame";
import { ChopGame } from "./games/ChopGame";
import { SauteGame } from "./games/SauteGame";
import { SeasonGame } from "./games/SeasonGame";
import { SimmerGame } from "./games/SimmerGame";
import { ActionGame } from "./games/ActionGame";
import { ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Phase = "loading" | "intro" | "playing" | "complete" | "error";

const STEP_ICONS: Record<string, string> = {
  drag: "👆", select: "🧺", pour: "🫗", mix: "🥄", crack: "🥚", temperature: "🌡️", timer: "⏱️",
  chop: "🔪", saute: "🍳", season: "🧂", simmer: "🫕", action: "📋",
};

export function PrepClient({ recipeId }: { recipeId: string | null }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [simulation, setSimulation] = useState<RecipeSimulation | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<StepResult[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [feedback, setFeedback] = useState<StepResult | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); };
  }, []);

  useEffect(() => {
    if (!recipeId) {
      setErrorMsg("No recipe selected. Head back and pick one!");
      setPhase("error");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/recipes/details?ids=${encodeURIComponent(recipeId)}`);
        if (!res.ok) throw new Error("Failed to load recipe");
        const data = (await res.json()) as { recipes?: Recipe[] };
        const r = data.recipes?.[0];
        if (!r || cancelled) { if (!cancelled) throw new Error("Recipe not found"); return; }
        setRecipe(r);

        const sim = getSimulation(r);
        setSimulation(sim);
        setPhase("intro");
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
          setPhase("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [recipeId]);

  const totalSteps = simulation?.steps.length ?? 0;
  const currentStep = simulation?.steps[stepIndex] ?? null;
  const perfectCount = results.filter(r => r.perfect).length;

  const advanceStep = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(null);
    if (stepIndex < totalSteps - 1) {
      setStepIndex(i => i + 1);
    } else {
      setPhase("complete");
    }
  }, [stepIndex, totalSteps]);

  const handleStepComplete = useCallback((result: StepResult) => {
    setResults(prev => [...prev, result]);
    setFeedback(result);
    feedbackTimer.current = setTimeout(advanceStep, 2000);
  }, [advanceStep]);

  function startPrep() {
    setPhase("playing");
    setStepIndex(0);
    setResults([]);
    setFeedback(null);
  }

  function renderGame() {
    if (!currentStep) return null;
    const key = `step-${stepIndex}`;
    switch (currentStep.type) {
      case "drag": return <DragGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "select": return <SelectGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "pour": return <PourGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "mix": return <MixGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "crack": return <CrackGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "temperature": return <OvenGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "timer": return <BakeGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "chop": return <ChopGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "saute": return <SauteGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "season": return <SeasonGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "simmer": return <SimmerGame key={key} step={currentStep} onComplete={handleStepComplete} />;
      case "action": return <ActionGame key={key} step={currentStep} onComplete={handleStepComplete} />;
    }
  }

  const gordonMood = phase === "loading" ? "thinking" : phase === "complete" ? "celebrating" : "idle";

  // ── Loading ────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="prep-mode-root">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
          <GordonAvatar mood="thinking" size={100} />
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-foreground">Setting up the virtual kitchen…</h2>
            <p className="mt-2 text-sm text-muted">Gordon is preparing your cooking simulation</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-2.5 w-2.5 rounded-full bg-accent loading-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="prep-mode-root">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
          <GordonAvatar mood="idle" size={90} />
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-foreground">Honk! Something went wrong</h2>
            <p className="mt-2 max-w-sm text-sm text-muted">{errorMsg}</p>
          </div>
          <Link href="/" className="mt-2 rounded-2xl border-2 border-accent bg-accent px-6 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_rgba(124,92,252,0.5)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none">
            Back to recipes
          </Link>
        </div>
      </div>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────
  if (phase === "intro" && simulation && recipe) {
    return (
      <div className="prep-mode-root">
        <div className="flex min-h-dvh flex-col">
          <div className="flex shrink-0 items-center justify-between border-b-2 border-edge bg-background px-4 py-3">
            <Link href="/" className="inline-flex items-center gap-1 rounded-xl border-2 border-edge bg-card px-3 py-1.5 text-xs font-extrabold text-foreground shadow-[0_2px_0_var(--edge)] transition-all hover:border-edge-hover active:translate-y-0.5 active:shadow-none">
              <ChevronLeft size={13} /> Back
            </Link>
            <span className="rounded-xl border-2 border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              Virtual Kitchen
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-5 overflow-y-auto px-6 pb-10 pt-6">
            {recipe.imageUrl && (
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-2 border-edge shadow-[0_6px_0_var(--edge)] sm:h-40 sm:w-40">
                <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" sizes="160px" />
              </div>
            )}

            <div className="text-center">
              <h1 className="text-2xl font-black text-foreground sm:text-3xl">{recipe.title}</h1>
              <p className="mt-1 text-sm font-bold text-accent">Virtual Kitchen · {totalSteps} steps</p>
            </div>

            <div className="flex w-full max-w-md items-start gap-3">
              <GordonAvatar mood="idle" size={48} className="mt-1 shrink-0" />
              <div className="gordon-bubble flex-1 rounded-3xl rounded-tl-md border-2 border-edge bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-[0_3px_0_var(--edge)]">
                {simulation.intro}
              </div>
            </div>

            <div className="w-full max-w-md space-y-2">
              {simulation.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border-2 border-edge bg-card px-4 py-2.5 shadow-[0_2px_0_var(--edge)]">
                  <span className="text-lg">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-foreground">{s.title}</p>
                    <p className="text-xs text-muted">{s.instruction}</p>
                  </div>
                  <span className="text-xs text-muted">{STEP_ICONS[s.type]}</span>
                </div>
              ))}
            </div>

            <button onClick={startPrep} className="mt-2 rounded-2xl border-2 border-accent bg-accent px-8 py-4 text-base font-black text-white shadow-[0_4px_0_rgba(124,92,252,0.5)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none">
              🧑‍🍳 Enter the Kitchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────
  if (phase === "playing" && currentStep) {
    return (
      <div className="prep-mode-root">
        <div className="flex min-h-dvh flex-col">
          {/* Top bar */}
          <div className="flex shrink-0 items-center justify-between border-b-2 border-edge bg-background px-4 py-3">
            <Link href="/" className="inline-flex items-center gap-1 rounded-xl border-2 border-edge bg-card px-3 py-1.5 text-xs font-extrabold text-foreground shadow-[0_2px_0_var(--edge)] transition-all hover:border-edge-hover active:translate-y-0.5 active:shadow-none">
              <ChevronLeft size={13} /> Exit
            </Link>
            <span className="rounded-xl border-2 border-edge bg-surface px-3 py-1.5 text-xs font-extrabold tabular-nums text-foreground shadow-[0_2px_0_var(--edge)]">
              Step {stepIndex + 1} / {totalSteps}
            </span>
          </div>

          {/* Step progress bar */}
          <div className="shrink-0 px-5 pt-3">
            <div className="flex gap-1">
              {simulation!.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i < stepIndex ? "bg-accent" : i === stepIndex ? "bg-accent/60" : "bg-surface"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 py-6 prep-challenge-enter" key={stepIndex}>
            {/* Step header */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentStep.emoji}</span>
              <h2 className="text-lg font-black text-foreground">{currentStep.title}</h2>
            </div>
            <p className="max-w-md text-center text-sm font-bold text-muted">{currentStep.instruction}</p>

            {/* Game */}
            {renderGame()}

            {/* Feedback overlay */}
            {feedback && (
              <div
                className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm prep-success-pop cursor-pointer"
                onClick={advanceStep}
              >
                <span className="text-5xl">{feedback.perfect ? "⭐" : "💪"}</span>
                <p className="text-xl font-black text-foreground">{feedback.perfect ? "Perfect!" : "Good try!"}</p>
                <p className="max-w-xs text-center text-sm text-muted">{feedback.message}</p>

                <div className="mt-2 flex max-w-sm items-start gap-2">
                  <GordonAvatar mood={feedback.perfect ? "celebrating" : "idle"} size={36} className="shrink-0" />
                  <div className="rounded-2xl rounded-tl-sm border-2 border-edge bg-card px-3 py-2 text-xs leading-relaxed text-foreground shadow-[0_2px_0_var(--edge)]">
                    {feedback.perfect ? currentStep.tip : currentStep.mistakeTip}
                  </div>
                </div>

                <p className="mt-1 text-xs text-muted">Tap to continue →</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────────
  if (phase === "complete" && simulation && recipe) {
    return (
      <div className="prep-mode-root">
        <div className="flex min-h-dvh flex-col items-center gap-6 overflow-y-auto px-6 py-10">
          <div className="relative">
            <GordonAvatar mood="celebrating" size={100} />
            <div className="confetti-burst pointer-events-none absolute inset-0" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black text-foreground sm:text-4xl">You Made It! 🎓</h1>
            <p className="mt-2 text-lg font-bold text-accent">{recipe.title}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 rounded-3xl border-2 border-edge bg-card px-6 py-4 shadow-[0_4px_0_var(--edge)]">
              <span className="text-2xl font-black text-accent">{perfectCount}/{totalSteps}</span>
              <span className="text-xs font-extrabold text-muted">Perfect</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-3xl border-2 border-edge bg-card px-6 py-4 shadow-[0_4px_0_var(--edge)]">
              <span className="text-2xl font-black text-accent">{totalSteps}</span>
              <span className="text-xs font-extrabold text-muted">Steps</span>
            </div>
          </div>

          {/* Per-step results */}
          <div className="w-full max-w-md space-y-2">
            {results.map((r, i) => {
              const step = simulation.steps[i];
              return (
                <div key={i} className="flex items-center gap-3 rounded-2xl border-2 border-edge bg-card px-4 py-2.5 shadow-[0_2px_0_var(--edge)]">
                  <span className="text-lg">{r.perfect ? "✅" : "⚠️"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-foreground">{step?.title}</p>
                    <p className="text-xs text-muted">{r.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gordon outro */}
          <div className="flex w-full max-w-md items-start gap-3">
            <GordonAvatar mood="celebrating" size={44} className="mt-1 shrink-0" />
            <div className="gordon-bubble flex-1 rounded-3xl rounded-tl-md border-2 border-edge bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-[0_3px_0_var(--edge)]">
              {simulation.completion}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/cook?id=${encodeURIComponent(recipe.id)}`}
              className="rounded-2xl border-2 border-primary-dark bg-primary px-8 py-4 text-center text-base font-black text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
            >
              🍳 Cook for Real!
            </Link>
            <button
              onClick={() => { setStepIndex(0); setResults([]); setFeedback(null); setPhase("intro"); }}
              className="rounded-2xl border-2 border-edge bg-surface px-6 py-4 text-center text-sm font-extrabold text-foreground shadow-[0_3px_0_var(--edge)] transition-all hover:border-edge-hover active:translate-y-0.5 active:shadow-none"
            >
              Practice Again
            </button>
          </div>

          <Link href="/" className="text-sm font-extrabold text-muted underline underline-offset-2 transition-colors hover:text-foreground">
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
