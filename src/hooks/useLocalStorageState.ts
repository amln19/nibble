"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function readStorageValue<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const fallbackRef = useRef(initial);
  useLayoutEffect(() => {
    fallbackRef.current = initial;
  }, [initial]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      setState(readStorageValue(window.localStorage, key, fallbackRef.current));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [key, state, hydrated]);

  return [state, setState];
}

export function useSessionStorageState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const fallbackRef = useRef(initial);
  useLayoutEffect(() => {
    fallbackRef.current = initial;
  }, [initial]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      setState(
        readStorageValue(window.sessionStorage, key, fallbackRef.current),
      );
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* */
    }
  }, [key, state, hydrated]);

  return [state, setState];
}

export function useSkippedRecipes() {
  const [skippedIds, setSkippedIds] = useSessionStorageState<string[]>(
    "recipe-swipe-skipped",
    [],
  );

  const skip = useCallback(
    (id: string) => {
      setSkippedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    [setSkippedIds],
  );

  const clearSession = useCallback(() => {
    setSkippedIds([]);
  }, [setSkippedIds]);

  return { skippedIds, skip, clearSession };
}
