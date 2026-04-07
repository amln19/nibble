"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "nibble-theme";

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* quota */
  }
}

function readThemeFromDocument(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => "light");
  const syncedRef = useRef(false);

  useLayoutEffect(() => {
    const t = readThemeFromDocument();
    syncedRef.current = true;
    /* Sync to <html class> from inline script before paint; deferring breaks applyTheme on first effect run */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional DOM→state hydration
    setTheme(t);
  }, []);

  useEffect(() => {
    if (!syncedRef.current) return;
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
