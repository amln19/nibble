"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SauteStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: SauteStep;
  onComplete: (result: StepResult) => void;
};

export function SauteGame({ step, onComplete }: Props) {
  const target = step.targetStirs;
  const [heat, setHeat] = useState(20);
  const [stirs, setStirs] = useState(0);
  const [canStir, setCanStir] = useState(false);
  const [sizzle, setSizzle] = useState(false);
  const completedRef = useRef(false);
  const heatRef = useRef(20);
  const burnsRef = useRef(0);
  const done = stirs >= target;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      heatRef.current = Math.min(100, heatRef.current + 1.2 + Math.random() * 0.5);
      setHeat(heatRef.current);

      if (heatRef.current >= 55) setCanStir(true);

      if (heatRef.current >= 100) {
        heatRef.current = 30;
        setHeat(30);
        setCanStir(false);
        burnsRef.current++;
        setSizzle(true);
        setTimeout(() => setSizzle(false), 500);
      }
    }, 80);
    return () => clearInterval(id);
  }, [done]);

  const handleStir = useCallback(() => {
    if (done || !canStir || completedRef.current) return;

    heatRef.current = 20;
    setHeat(20);
    setCanStir(false);
    setSizzle(true);
    setTimeout(() => setSizzle(false), 300);

    setStirs(prev => {
      const next = prev + 1;
      if (next >= target && !completedRef.current) {
        completedRef.current = true;
        const burns = burnsRef.current;
        setTimeout(() => {
          onComplete({
            perfect: burns === 0,
            message:
              burns === 0
                ? "Perfect sauté — nothing burned!"
                : `Done, but ${burns} burn${burns > 1 ? "s" : ""}. Watch the heat next time!`,
          });
        }, 600);
      }
      return next;
    });
  }, [done, canStir, target, onComplete]);

  const heatColor =
    heat < 40 ? "#60a5fa" : heat < 65 ? "#fbbf24" : heat < 85 ? "#f97316" : "#ef4444";
  const heatLabel = heat < 40 ? "LOW" : heat < 65 ? "MEDIUM" : heat < 85 ? "HOT" : "BURNING";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pan */}
      <div
        className={`relative flex h-32 w-48 items-end justify-center overflow-hidden rounded-b-[6rem] rounded-t-xl border-2 shadow-[0_4px_0_var(--edge)] transition-colors sm:h-36 sm:w-56 ${
          heat >= 85
            ? "border-red-400 bg-red-50 dark:bg-red-900/20"
            : "border-edge bg-card"
        }`}
      >
        <div className="mb-4 flex gap-2">
          <span className={`text-3xl transition-transform ${sizzle ? "scale-110" : ""}`}>
            🍳
          </span>
          <span className="text-2xl">{step.emoji}</span>
        </div>

        {heat >= 80 && (
          <div className="absolute top-1 left-1/2 flex -translate-x-1/2 gap-2">
            {[0, 1].map(i => (
              <span
                key={i}
                className="prep-smoke text-sm"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                💨
              </span>
            ))}
          </div>
        )}

        <div
          className="absolute top-2 right-2 rounded-lg px-2 py-0.5 text-[10px] font-black"
          style={{ backgroundColor: heatColor + "30", color: heatColor }}
        >
          {heatLabel}
        </div>
      </div>

      {/* Heat bar */}
      <div className="w-full max-w-xs">
        <div className="h-3 w-full overflow-hidden rounded-full border-2 border-edge bg-surface">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${heat}%`, backgroundColor: heatColor }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-extrabold text-muted">
          <span>Cool</span>
          <span>🔥 Too Hot!</span>
        </div>
      </div>

      <p className="text-sm font-extrabold text-muted">
        {done ? "Cooked! ✨" : `${stirs} / ${target} stirs`}
      </p>

      <button
        type="button"
        onClick={handleStir}
        disabled={done || !canStir}
        className={`tap-3d h-16 w-44 rounded-2xl border-2 text-sm font-black transition-all ${
          done
            ? "border-edge bg-surface text-muted"
            : canStir
              ? "border-orange-500 bg-orange-400 text-white shadow-[0_4px_0_rgba(234,88,12,0.4)] active:translate-y-1 active:shadow-none prep-heat-glow"
              : "border-edge bg-surface text-muted"
        }`}
      >
        {done ? "✓ Cooked!" : canStir ? "🥄 STIR NOW!" : "Heating up…"}
      </button>
    </div>
  );
}
