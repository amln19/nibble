"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        setState(JSON.parse(raw) as T);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
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

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw != null) {
        setState(JSON.parse(raw) as T);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
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

  const skip = useCallback((id: string) => {
    setSkippedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, [setSkippedIds]);

  const clearSession = useCallback(() => {
    setSkippedIds([]);
  }, [setSkippedIds]);

  return { skippedIds, skip, clearSession };
}
