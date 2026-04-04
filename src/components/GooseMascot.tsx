"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type GooseState = "happy" | "excited";

const MESSAGES = [
  "Let's cook! 🍳",
  "Hungry? 😋",
  "New recipes!",
  "What's for dinner?",
  "Bon appétit! 🥂",
  "Time to cook!",
];

/** Shared animation hook */
function useGooseAnimation() {
  const [state, setState] = useState<GooseState>("happy");
  const [bounce, setBounce] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      const delay = 4000 + Math.random() * 4000;
      timerRef.current = setTimeout(() => {
        setBounce(true);
        setTimeout(() => setBounce(false), 650);
        setTimeout(() => {
          setState("excited");
          setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
          setTimeout(() => {
            setState("happy");
            setTimeout(() => setMessage(null), 400);
            cycle();
          }, 1800);
        }, 150);
      }, delay);
    };
    cycle();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { state, bounce, message, setState, setBounce, setMessage };
}

/** Goose image pair — renders happy/excited with crossfade */
function GooseImages({ state, size }: { state: GooseState; size: string }) {
  return (
    <>
      <Image src="/goose-happy.png" alt="Goose chef" fill
        className={`object-contain transition-opacity duration-200 ${state === "happy" ? "opacity-100" : "opacity-0"}`}
        sizes={size} priority />
      <Image src="/goose-excited.png" alt="Goose chef excited" fill
        className={`object-contain transition-opacity duration-200 ${state === "excited" ? "opacity-100" : "opacity-0"}`}
        sizes={size} priority />
    </>
  );
}

/** Fixed bottom-right corner mascot — shown on all pages except /login */
export function GooseMascot() {
  const pathname = usePathname();
  const { state, bounce, message, setState, setBounce, setMessage } = useGooseAnimation();
  const [entered, setEntered] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (pathname === "/login") return null;

  const isCompanionMode = pathname?.startsWith("/cook") || pathname?.startsWith("/prep");
  const positionClasses = isCompanionMode
    ? "left-6 items-start"
    : "right-6 items-end";
  const bubbleClasses = isCompanionMode
    ? "rounded-br-sm"
    : "rounded-bl-sm";
  const bubbleTailClasses = isCompanionMode
    ? "right-4 border-l-[9px] border-r-0"
    : "left-4 border-l-0 border-r-[9px]";

  if (hidden) {
    return (
      <button
        type="button"
        aria-label="Show goose mascot"
        onClick={() => setHidden(false)}
        className={`fixed bottom-4 ${isCompanionMode ? "left-4" : "right-4"} z-50 flex items-center gap-1.5 rounded-full border-2 border-primary/40 bg-card px-3 py-1.5 text-xs font-extrabold text-muted shadow-lg transition-all hover:border-primary hover:text-primary hover:shadow-xl active:scale-95`}
      >
        <Image src="/goose-happy.png" alt="" width={22} height={22} className="object-contain" />
        <span>Show Gordon</span>
      </button>
    );
  }

  return (
    <div
      className={`group fixed bottom-6 ${positionClasses} z-[10000] flex flex-col gap-3 transition-all duration-700 ease-out ${
        entered ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"
      }`}
    >
      {/* Speech bubble */}
      <div
        className={`relative max-w-[180px] rounded-2xl ${bubbleClasses} border-2 border-edge bg-card px-4 py-2.5 text-[14px] font-extrabold text-foreground shadow-xl transition-all duration-300 dark:border-stone-300 dark:bg-white dark:text-neutral-950 ${
          message ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
        }`}
      >
        {message}
        <span
          className={`absolute -bottom-2.5 ${bubbleTailClasses} h-0 w-0 border-t-[12px] border-solid border-l-transparent border-r-transparent border-t-card dark:border-t-white`}
          aria-hidden
        />
      </div>

      {/* Hide button — appears on hover */}
      <button
        type="button"
        aria-label="Hide goose mascot"
        onClick={() => setHidden(true)}
        className={`absolute -bottom-1 ${isCompanionMode ? "-left-1" : "-right-1"} z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-edge bg-card text-muted opacity-0 shadow-md transition-all hover:border-red-300 hover:text-red-500 group-hover:opacity-100`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      {/* Goose button */}
      <button type="button" aria-label="Goose mascot"
        onClick={() => {
          setBounce(true);
          setTimeout(() => setBounce(false), 600);
          setState("excited");
          setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
          setTimeout(() => { setState("happy"); setTimeout(() => setMessage(null), 400); }, 2000);
        }}
        className={`relative cursor-pointer select-none ${
          bounce ? "animate-goose-bounce" : "animate-goose-idle"
        }`}
        style={{ background: "none", border: "none", padding: 0, willChange: "transform" }}
      >
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
        <div className="relative h-48 w-48 drop-shadow-2xl">
          <GooseImages state={state} size="192px" />
        </div>
      </button>
    </div>
  );
}

/** Inline animated goose for the login page — no fixed positioning, no speech bubble */
export function GooseLoginMascot() {
  const { state, bounce } = useGooseAnimation();

  return (
    <div className={`relative h-40 w-40 drop-shadow-xl ${bounce ? "animate-goose-bounce" : "animate-goose-idle"}`}>
      <GooseImages state={state} size="160px" />
    </div>
  );
}

/** Nav logo version — small static image (not animated to keep nav lightweight) */
export function GooseNavLogo() {
  return null; // kept for import compatibility
}
