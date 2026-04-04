"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [key, state]);

  return [state, setState];
}

export function useSessionStorageState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw == null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* */
    }
  }, [key, state]);

  return [state, setState];
}

export function useRecipeBox() {
  const [savedIds, setSavedIds] = useLocalStorageState<string[]>(
    "recipe-box-ids",
    [],
  );

  const add = useCallback((id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, [setSavedIds]);

  const remove = useCallback((id: string) => {
    setSavedIds((prev) => prev.filter((x) => x !== id));
  }, [setSavedIds]);

  return { savedIds, add, remove, setSavedIds };
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
