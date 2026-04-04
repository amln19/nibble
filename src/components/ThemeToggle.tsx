"use client";

import { useTheme } from "@/components/ThemeProvider";

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const { theme, toggle } = useTheme();

  if (mobile) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex flex-col items-center gap-0.5 py-1.5"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <span className="flex h-9 w-14 items-center justify-center rounded-xl text-muted transition-all hover:bg-surface">
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </span>
        <span className="text-[10px] font-extrabold text-muted">
          {theme === "light" ? "Dark" : "Light"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="tap-3d flex h-9 w-9 items-center justify-center rounded-xl border-2 border-edge text-muted transition-colors hover:border-edge-hover hover:bg-surface"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
