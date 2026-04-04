"use client";

import type { Recipe } from "@/lib/recipes";
import type { GordonGuide, GordonStep } from "@/lib/gordon/types";
import { incrementCookSessions } from "@/lib/achievements";
import { ActionAnimation } from "./ActionAnimations";
import { GordonAvatar } from "./GordonAvatar";
import { TimerRing } from "./TimerRing";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";

type Phase = "loading" | "intro" | "cooking" | "complete" | "error";

export function CompanionMode({ recipeId }: { recipeId: string | null }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [guide, setGuide] = useState<GordonGuide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [showIngredients, setShowIngredients] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Keep screen on while cooking
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (phase !== "cooking" && phase !== "intro") {
      wakeLockRef.current?.release();
      return;
    }
    let lock: WakeLockSentinel | null = null;
    (async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = lock;
      } catch { /* unsupported */ }
    })();
    return () => { lock?.release(); };
  }, [phase]);

  // Load recipe + Gordon guide
  useEffect(() => {
    if (!recipeId) {
      setErrorMsg("No recipe selected. Head back and pick one!");
      setPhase("error");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const detailRes = await fetch(`/api/recipes/details?ids=${encodeURIComponent(recipeId)}`);
        if (!detailRes.ok) throw new Error("Failed to load recipe");
        const detailData = (await detailRes.json()) as { recipes?: Recipe[] };
        const r = detailData.recipes?.[0];
        if (!r || cancelled) { if (!cancelled) throw new Error("Recipe not found"); return; }
        setRecipe(r);
        if (!r.instructions) throw new Error("This recipe has no instructions.");
        const prepRes = await fetch("/api/gordon/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: r.title, instructions: r.instructions, ingredients: r.ingredients }),
        });
        if (!prepRes.ok) throw new Error("Gordon couldn't prepare the guide");
        const prepData = (await prepRes.json()) as { guide: GordonGuide };
        if (cancelled) return;
        setGuide(prepData.guide);
        setPhase("intro");
      } catch (e) {
        if (!cancelled) { setErrorMsg(e instanceof Error ? e.message : "Something went wrong"); setPhase("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [recipeId]);

  // ── Audio ──────────────────────────────────────────────────────────────────
  // speak() must be called directly from a user-gesture handler (click/tap),
  // NOT from a useEffect — browsers block autoplay outside gesture context.
  const speak = useCallback(async (text: string) => {
    if (mutedRef.current) return;
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/gordon/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { setIsSpeaking(false); return; }
      const blob = await res.blob();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      audioRef.current.onended = () => setIsSpeaking(false);
      audioRef.current.onerror = () => setIsSpeaking(false);
      await audioRef.current.play();
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsSpeaking(false);
  }, []);

  // Speak intro when entering intro phase
  useEffect(() => {
    if (phase === "intro" && guide) {
      speak(guide.intro);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Speak step when step changes
  useEffect(() => {
    if (phase !== "cooking" || !guide) return;
    const s = guide.steps[currentStep];
    if (!s) return;
    stopAudio();
    const fullText = `${s.instruction} ... ${s.tip}`;
    speak(fullText);
    setTimerRunning(false);
    setTimerDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, phase]);

  // Speak completion
  useEffect(() => {
    if (phase === "complete" && guide) {
      speak(guide.completion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const totalSteps = guide?.steps.length ?? 0;
  const step: GordonStep | null = guide?.steps[currentStep] ?? null;

  function stepText(s: GordonStep) {
    return `${s.instruction} ... ${s.tip}`;
  }

  function startCooking() {
    setPhase("cooking");
    setCurrentStep(0);
    setTimerRunning(false);
    setTimerDone(false);
  }

  function nextStep() {
    stopAudio();
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setPhase("complete");
      incrementCookSessions();
    }
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function handleTimerComplete() {
    setTimerRunning(false);
    setTimerDone(true);
    void speak("Time's up, chef! Let's keep going!");
  }

  function toggleMute() {
    setMuted((m) => { if (!m) stopAudio(); return !m; });
  }

  const elapsed = useMemo(() => {
    if (phase !== "complete") return 0;
    return Math.round((Date.now() - startTime) / 1000);
  }, [phase, startTime]);

  const gordonMood =
    phase === "loading" || phase === "error" ? "thinking"
    : phase === "complete" ? "celebrating"
    : isSpeaking ? "speaking"
    : "idle";

  // ── Shared top bar ─────────────────────────────────────────────────────────
  function TopBar({ center, backLabel = "Back", backHref = "/" }: { center?: React.ReactNode; backLabel?: string; backHref?: string }) {
    return (
      <div className="flex shrink-0 items-center justify-between border-b-2 border-edge bg-background px-4 py-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-xl border-2 border-edge bg-card px-3 py-1.5 text-xs font-extrabold text-foreground shadow-[0_2px_0_var(--edge)] transition-all hover:border-edge-hover active:translate-y-0.5 active:shadow-none"
        >
          <ChevronLeft size={13} />
          {backLabel}
        </Link>
        {center ?? <span />}
        <button
          onClick={toggleMute}
          className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold shadow-[0_2px_0_var(--edge)] transition-all active:translate-y-0.5 active:shadow-none ${
            muted
              ? "border-edge bg-card text-muted"
              : "border-primary bg-primary-light text-primary-dark shadow-[0_2px_0_var(--primary)]"
          }`}
          aria-label={muted ? "Unmute Gordon" : "Mute Gordon"}
        >
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          {muted ? "Muted" : "Voice on"}
        </button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
          <GordonAvatar mood="thinking" size={100} />
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-foreground">
              Gordon is studying your recipe…
            </h2>
            <p className="mt-2 text-sm text-muted">
              Preparing tips, timers, and terrible puns
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-primary loading-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
          <GordonAvatar mood="idle" size={90} />
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-foreground">Honk! Something went wrong</h2>
            <p className="mt-2 max-w-sm text-sm text-muted">{errorMsg}</p>
          </div>
          <Link
            href="/"
            className="mt-2 rounded-2xl border-2 border-primary-dark bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
          >
            Back to recipes
          </Link>
        </div>
      </div>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro" && guide && recipe) {
    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col">
          <TopBar />

          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-10">
            {/* Recipe image */}
            {recipe.imageUrl && (
              <div className="relative h-36 w-36 overflow-hidden rounded-3xl border-2 border-edge shadow-[0_6px_0_var(--edge)] sm:h-44 sm:w-44">
                <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" sizes="176px" />
              </div>
            )}

            <div className="text-center">
              <h1 className="text-2xl font-black text-foreground sm:text-3xl">{recipe.title}</h1>
              <p className="mt-1 text-sm text-muted">
                {totalSteps} steps{recipe.timeMinutes ? ` · ~${recipe.timeMinutes} min` : ""}
              </p>
            </div>

            {/* Gordon's intro bubble */}
            <div className="flex w-full max-w-md items-start gap-3">
              <GordonAvatar mood={gordonMood} size={52} className="mt-1 shrink-0" />
              <div className="gordon-bubble flex-1 rounded-3xl rounded-tl-md border-2 border-edge bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-[0_3px_0_var(--edge)]">
                {guide.intro}
              </div>
            </div>

            {/* Ingredient list */}
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="text-xs font-extrabold text-primary-dark underline underline-offset-2 transition-colors hover:text-primary"
            >
              {showIngredients ? "Hide ingredients" : `Check ingredients (${recipe.ingredients.length})`}
            </button>

            {showIngredients && (
              <div className="w-full max-w-md rounded-3xl border-2 border-edge bg-card p-4 shadow-[0_3px_0_var(--edge)]">
                <ul className="space-y-1.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Start — speak step 1 directly from this gesture */}
            <button
              onClick={startCooking}
              className="mt-2 rounded-2xl border-2 border-primary-dark bg-primary px-8 py-4 text-base font-black text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
            >
              🍳 Let&apos;s Cook!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Cooking ────────────────────────────────────────────────────────────────
  if (phase === "cooking" && guide && step) {
    const hasTimer = step.timerSeconds > 0;

    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col">
          <TopBar
            center={
              <span className="rounded-xl border-2 border-edge bg-surface px-3 py-1.5 text-xs font-extrabold tabular-nums text-foreground shadow-[0_2px_0_var(--edge)]">
                {currentStep + 1} / {totalSteps}
              </span>
            }
            backLabel="Exit"
          />

          {/* Progress bar */}
          <div className="shrink-0 px-5 pt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div
            className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-6 step-transition"
            key={currentStep}
          >
            {/* Step badge */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-primary bg-primary-light text-lg font-black text-primary-dark shadow-[0_3px_0_var(--primary)]">
              {currentStep + 1}
            </div>

            {/* Action animation */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 scale-150 rounded-full blur-2xl opacity-10"
                style={{ backgroundColor: step.accentColor || "var(--primary)" }}
              />
              <ActionAnimation action={step.action ?? "plate"} accentColor={step.accentColor} size={96} />
            </div>

            {/* Instruction */}
            <p className="max-w-lg text-center text-xl font-bold leading-relaxed text-foreground sm:text-2xl">
              {step.instruction}
            </p>

            {/* Timer */}
            {hasTimer && (
              <div className="flex flex-col items-center gap-3">
                <TimerRing
                  totalSeconds={step.timerSeconds}
                  label={step.timerLabel}
                  onComplete={handleTimerComplete}
                  running={timerRunning}
                />
                {!timerRunning && !timerDone && (
                  <button
                    onClick={() => setTimerRunning(true)}
                    className="rounded-xl border-2 border-primary bg-primary-light px-5 py-2 text-sm font-extrabold text-primary-dark shadow-[0_2px_0_var(--primary)] transition-all hover:bg-primary hover:text-white active:translate-y-0.5 active:shadow-none"
                  >
                    Start Timer
                  </button>
                )}
                {timerDone && (
                  <span className="flex items-center gap-1.5 rounded-xl border-2 border-edge bg-surface px-3 py-1.5 text-sm font-extrabold text-foreground">
                    ✓ Timer complete
                  </span>
                )}
              </div>
            )}

            {/* Gordon's tip bubble */}
            <div className="flex w-full max-w-md items-start gap-3">
              <GordonAvatar mood={gordonMood} size={40} className="mt-0.5 shrink-0" />
              <div className="gordon-bubble flex-1 rounded-3xl rounded-tl-md border-2 border-edge bg-card px-4 py-3 text-sm leading-relaxed text-muted shadow-[0_3px_0_var(--edge)]">
                {step.tip}
              </div>
            </div>

            {/* Replay voice */}
            {!muted && (
              <button
                onClick={() => { stopAudio(); void speak(stepText(step)); }}
                disabled={isSpeaking}
                className="flex items-center gap-1.5 text-xs font-extrabold text-muted transition-colors hover:text-foreground disabled:opacity-40"
              >
                <RotateCcw size={12} />
                {isSpeaking ? "Gordon is speaking…" : "Replay"}
              </button>
            )}
          </div>

          {/* Bottom nav */}
          <div className="safe-bottom shrink-0 border-t-2 border-edge bg-card px-5 py-4">
            {/* Step dots */}
            <div className="mb-4 flex justify-center gap-1.5">
              {guide.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-edge"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-edge bg-surface py-3.5 text-sm font-extrabold text-muted shadow-[0_3px_0_var(--edge)] transition-all hover:border-edge-hover hover:text-foreground active:translate-y-0.5 active:shadow-none disabled:opacity-30"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={nextStep}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-primary-dark bg-primary py-3.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
              >
                {currentStep === totalSteps - 1 ? "Finish 🎉" : <>Next <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  if (phase === "complete" && guide && recipe) {
    const elapsedMin = Math.floor(elapsed / 60);
    const elapsedSec = elapsed % 60;

    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
          <div className="relative">
            <GordonAvatar mood="celebrating" size={110} />
            <div className="confetti-burst pointer-events-none absolute inset-0" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black text-foreground sm:text-4xl">
              Masterpiece Complete! 🎉
            </h1>
            <p className="mt-2 text-lg font-bold text-primary-dark">{recipe.title}</p>
          </div>

          {/* Gordon's outro */}
          <div className="flex w-full max-w-md items-start gap-3">
            <GordonAvatar mood="celebrating" size={44} className="mt-1 shrink-0" />
            <div className="gordon-bubble flex-1 rounded-3xl rounded-tl-md border-2 border-edge bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-[0_3px_0_var(--edge)]">
              {guide.completion}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 rounded-3xl border-2 border-edge bg-card px-6 py-4 shadow-[0_4px_0_var(--edge)]">
              <span className="text-2xl font-black text-primary-dark">{totalSteps}</span>
              <span className="text-xs font-extrabold text-muted">Steps</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-3xl border-2 border-edge bg-card px-6 py-4 shadow-[0_4px_0_var(--edge)]">
              <span className="text-2xl font-black text-primary-dark">
                {elapsedMin > 0 ? `${elapsedMin}m ` : ""}{elapsedSec}s
              </span>
              <span className="text-xs font-extrabold text-muted">Time</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => { setCurrentStep(0); setPhase("intro"); }}
              className="rounded-2xl border-2 border-edge bg-surface px-6 py-3 text-sm font-extrabold text-foreground shadow-[0_3px_0_var(--edge)] transition-all hover:border-edge-hover active:translate-y-0.5 active:shadow-none"
            >
              <RotateCcw size={14} className="mr-1.5 inline" />
              Cook Again
            </button>
            <Link
              href="/"
              className="rounded-2xl border-2 border-primary-dark bg-primary px-6 py-3 text-center text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
            >
              Back to Recipes
            </Link>
          </div>

          <p className="mt-2 text-xs text-muted">
            Powered by Gordon the Goose · Gemini AI · ElevenLabs
          </p>
        </div>
      </div>
    );
  }

  return null;
}
