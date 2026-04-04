"use client";

import type { Recipe } from "@/lib/recipes";
import type { GordonGuide, GordonStep } from "@/lib/gordon/types";
import { ActionAnimation } from "./ActionAnimations";
import { GordonAvatar } from "./GordonAvatar";
import { TimerRing } from "./TimerRing";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";

type Phase =
  | "loading"
  | "intro"
  | "cooking"
  | "complete"
  | "error";

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

  // Wake Lock to keep screen on while cooking
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
      } catch { /* unsupported or denied */ }
    })();
    return () => { lock?.release(); };
  }, [phase]);

  // Load recipe + prepare Gordon's guide
  useEffect(() => {
    if (!recipeId) {
      setErrorMsg("No recipe selected. Head back and pick one!");
      setPhase("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Fetch recipe details
        const detailRes = await fetch(
          `/api/recipes/details?ids=${encodeURIComponent(recipeId)}`,
        );
        if (!detailRes.ok) throw new Error("Failed to load recipe");
        const detailData = (await detailRes.json()) as { recipes?: Recipe[] };
        const r = detailData.recipes?.[0];
        if (!r || cancelled) {
          if (!cancelled) throw new Error("Recipe not found");
          return;
        }
        setRecipe(r);

        if (!r.instructions) {
          throw new Error("This recipe has no instructions for Gordon to work with.");
        }

        // Prepare Gordon's guide via Gemini
        const prepRes = await fetch("/api/gordon/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: r.title,
            instructions: r.instructions,
            ingredients: r.ingredients,
          }),
        });

        if (!prepRes.ok) throw new Error("Gordon couldn't prepare the guide");
        const prepData = (await prepRes.json()) as { guide: GordonGuide };
        if (cancelled) return;

        setGuide(prepData.guide);
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

  // --- Audio ---
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
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = url;
      audioRef.current.onended = () => setIsSpeaking(false);
      audioRef.current.onerror = () => setIsSpeaking(false);
      await audioRef.current.play();
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
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
    const step = guide.steps[currentStep];
    if (!step) return;
    stopAudio();
    const fullText = `${step.instruction} ... ${step.tip}`;
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

  // --- Navigation ---
  const totalSteps = guide?.steps.length ?? 0;
  const step: GordonStep | null = guide?.steps[currentStep] ?? null;

  function startCooking() {
    setPhase("cooking");
    setCurrentStep(0);
  }

  function nextStep() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setPhase("complete");
    }
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function handleTimerComplete() {
    setTimerRunning(false);
    setTimerDone(true);
    speak("Time's up, chef! Let's keep going!");
  }

  function toggleMute() {
    setMuted((m) => {
      if (!m) stopAudio();
      return !m;
    });
  }

  const elapsed = useMemo(() => {
    if (phase !== "complete") return 0;
    return Math.round((Date.now() - startTime) / 1000);
  }, [phase, startTime]);

  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;

  const gordonMood =
    phase === "loading" || phase === "error"
      ? "thinking"
      : phase === "complete"
        ? "celebrating"
        : isSpeaking
          ? "speaking"
          : "idle";

  // --- Render ---

  if (phase === "loading") {
    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
          <GordonAvatar mood="thinking" size={120} />
          <div className="text-center">
            <h2 className="text-xl font-bold text-amber-100">
              Gordon is studying your recipe...
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Preparing tips, timers, and terrible puns
            </p>
          </div>
          <div className="mt-4 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-amber-400 loading-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
          <GordonAvatar mood="idle" size={100} />
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-300">Honk! Something went wrong</h2>
            <p className="mt-2 max-w-sm text-sm text-stone-400">{errorMsg}</p>
          </div>
          <Link
            href="/"
            className="mt-4 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-900 transition-all hover:bg-amber-400 active:translate-y-0.5"
          >
            Back to recipes
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "intro" && guide && recipe) {
    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4">
            <Link href="/" className="text-sm font-bold text-stone-400 hover:text-stone-200 transition-colors">
              ← Back
            </Link>
            <button
              onClick={toggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-800 text-lg transition-all hover:bg-stone-700"
              aria-label={muted ? "Unmute Gordon" : "Mute Gordon"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-12">
            {/* Recipe image */}
            {recipe.imageUrl && (
              <div className="relative h-36 w-36 overflow-hidden rounded-3xl shadow-2xl ring-2 ring-amber-400/30 sm:h-44 sm:w-44">
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  sizes="176px"
                />
              </div>
            )}

            <div className="text-center">
              <h1 className="text-2xl font-black text-amber-50 sm:text-3xl">
                {recipe.title}
              </h1>
              <p className="mt-1 text-sm text-stone-400">
                {totalSteps} steps
                {recipe.timeMinutes ? ` · ~${recipe.timeMinutes} min` : ""}
              </p>
            </div>

            {/* Gordon's intro */}
            <div className="flex max-w-md items-start gap-3">
              <GordonAvatar mood={gordonMood} size={56} className="shrink-0 mt-1" />
              <div className="gordon-bubble rounded-2xl rounded-tl-md bg-stone-800/80 px-4 py-3 text-sm leading-relaxed text-stone-200 shadow-lg backdrop-blur">
                {guide.intro}
              </div>
            </div>

            {/* Ingredient check */}
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="text-xs font-bold text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
            >
              {showIngredients ? "Hide ingredients" : `Check ingredients (${recipe.ingredients.length})`}
            </button>

            {showIngredients && (
              <div className="w-full max-w-md rounded-2xl bg-stone-800/60 p-4 backdrop-blur">
                <ul className="space-y-1.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-stone-300">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Start button */}
            <button
              onClick={startCooking}
              className="group mt-4 flex items-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-8 py-4 text-base font-black text-stone-900 shadow-[0_4px_20px_rgba(251,191,36,0.4)] transition-all hover:shadow-[0_6px_30px_rgba(251,191,36,0.5)] active:translate-y-0.5"
            >
              <span className="text-xl transition-transform group-hover:rotate-12">🍳</span>
              Let&apos;s Cook!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "cooking" && guide && step) {
    const hasTimer = step.timerSeconds > 0;

    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4">
            <Link href="/" className="text-sm font-bold text-stone-400 hover:text-stone-200 transition-colors">
              ← Exit
            </Link>
            <span className="text-xs font-bold tabular-nums text-stone-500">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <button
              onClick={toggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-800 text-lg transition-all hover:bg-stone-700"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-400 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 step-transition" key={currentStep}>
            {/* Step number badge */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-xl font-black text-amber-400">
              {currentStep + 1}
            </div>

            {/* Action animation */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 scale-150 rounded-full blur-2xl"
                style={{ backgroundColor: step.accentColor || "#fbbf24", opacity: 0.07 }}
              />
              <ActionAnimation
                action={step.action ?? "plate"}
                accentColor={step.accentColor}
                size={100}
              />
            </div>

            {/* Main instruction */}
            <p className="max-w-lg text-center text-xl font-bold leading-relaxed text-stone-100 sm:text-2xl">
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
                    className="rounded-xl bg-amber-500/20 px-5 py-2 text-sm font-bold text-amber-300 transition-all hover:bg-amber-500/30 active:translate-y-0.5"
                  >
                    Start Timer
                  </button>
                )}
                {timerDone && (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                    <span>✓</span> Timer complete
                  </span>
                )}
              </div>
            )}

            {/* Gordon's tip */}
            <div className="flex max-w-md items-start gap-3">
              <GordonAvatar mood={gordonMood} size={44} className="shrink-0 mt-0.5" />
              <div className="gordon-bubble rounded-2xl rounded-tl-md bg-stone-800/70 px-4 py-3 text-sm leading-relaxed text-stone-300 shadow-lg backdrop-blur">
                {step.tip}
              </div>
            </div>

            {/* Replay voice */}
            {!muted && (
              <button
                onClick={() => {
                  stopAudio();
                  speak(`${step.instruction} ... ${step.tip}`);
                }}
                disabled={isSpeaking}
                className="text-xs font-bold text-stone-500 hover:text-stone-300 transition-colors disabled:opacity-40"
              >
                {isSpeaking ? "Gordon is speaking..." : "🔄 Replay Gordon's voice"}
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="safe-bottom flex items-center justify-between gap-4 border-t border-stone-800 bg-stone-900/80 px-6 py-5 backdrop-blur-sm">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 rounded-2xl bg-stone-800 px-5 py-3.5 text-sm font-bold text-stone-300 transition-all hover:bg-stone-700 active:translate-y-0.5 disabled:opacity-30 disabled:hover:bg-stone-800"
            >
              ← Back
            </button>

            <div className="flex gap-1">
              {guide.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-amber-400"
                      : i < currentStep
                        ? "w-1.5 bg-amber-600"
                        : "w-1.5 bg-stone-700"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-sm font-black text-stone-900 shadow-[0_2px_12px_rgba(251,191,36,0.3)] transition-all hover:shadow-[0_4px_20px_rgba(251,191,36,0.4)] active:translate-y-0.5"
            >
              {currentStep === totalSteps - 1 ? "Finish! 🎉" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "complete" && guide && recipe) {
    return (
      <div className="cook-mode-root">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
          {/* Celebration */}
          <div className="relative">
            <GordonAvatar mood="celebrating" size={120} />
            <div className="confetti-burst absolute inset-0 pointer-events-none" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black text-amber-50 sm:text-4xl">
              Masterpiece Complete!
            </h1>
            <p className="mt-2 text-lg font-semibold text-amber-300">
              {recipe.title}
            </p>
          </div>

          {/* Gordon's outro */}
          <div className="flex max-w-md items-start gap-3">
            <GordonAvatar mood="celebrating" size={48} className="shrink-0 mt-1" />
            <div className="gordon-bubble rounded-2xl rounded-tl-md bg-stone-800/80 px-4 py-3 text-sm leading-relaxed text-stone-200 shadow-lg backdrop-blur">
              {guide.completion}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-stone-800/60 px-6 py-4 backdrop-blur">
              <span className="text-2xl font-black text-amber-300">{totalSteps}</span>
              <span className="text-xs font-bold text-stone-400">Steps</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-stone-800/60 px-6 py-4 backdrop-blur">
              <span className="text-2xl font-black text-amber-300">
                {elapsedMin > 0 ? `${elapsedMin}m` : ""}{elapsedSec}s
              </span>
              <span className="text-xs font-bold text-stone-400">Time</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                setCurrentStep(0);
                setPhase("intro");
              }}
              className="rounded-2xl bg-stone-800 px-6 py-3 text-sm font-bold text-stone-300 transition-all hover:bg-stone-700 active:translate-y-0.5"
            >
              🔄 Cook Again
            </button>
            <Link
              href="/"
              className="rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-3 text-center text-sm font-black text-stone-900 transition-all hover:shadow-lg active:translate-y-0.5"
            >
              Back to Recipes
            </Link>
          </div>

          <p className="mt-4 text-xs text-stone-600">
            Powered by Gordon the Goose · Gemini AI · ElevenLabs
          </p>
        </div>
      </div>
    );
  }

  return null;
}
