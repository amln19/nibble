"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  totalSeconds: number;
  label: string | null;
  onComplete: () => void;
  running: boolean;
};

export function TimerRing({ totalSeconds, label, onComplete, running }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(id);
          onCompleteRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const urgent = remaining <= 10 && remaining > 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: 148, height: 148 }}>
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full transition-opacity duration-500"
          style={{
            boxShadow: urgent
              ? "0 0 40px rgba(239,68,68,0.4)"
              : "0 0 30px rgba(251,191,36,0.2)",
            opacity: running ? 1 : 0.3,
          }}
        />

        <svg width="148" height="148" viewBox="0 0 128 128">
          {/* Background track */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={urgent ? "#ef4444" : "#fbbf24"}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 64 64)"
            className="transition-[stroke-dashoffset] duration-1000 linear"
            style={{ filter: `drop-shadow(0 0 6px ${urgent ? "rgba(239,68,68,0.6)" : "rgba(251,191,36,0.5)"})` }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono text-3xl font-black tabular-nums tracking-tight ${
              urgent ? "text-red-400 timer-pulse" : "text-amber-200"
            }`}
          >
            {display}
          </span>
          {remaining === 0 && (
            <span className="mt-1 text-xs font-bold text-emerald-400">Done!</span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-center text-sm font-semibold text-stone-400">
          {label}
        </span>
      )}
    </div>
  );
}
