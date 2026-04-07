"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "recipe-box-ids";

function readLocalIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Deduplicate while preserving order
    const seen = new Set<string>();
    return parsed.filter((x): x is string => {
      if (typeof x !== "string" || seen.has(x)) return false;
      seen.add(x);
      return true;
    });
  } catch {
    return [];
  }
}

function writeLocalIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota */
  }
}

export function useRecipeBox() {
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    createClient() ? [] : readLocalIds(),
  );
  const [ready, setReady] = useState(() => createClient() === null);
  const userIdRef = useRef<string | null>(null);

  const syncFromCloud = useCallback(async (userId: string) => {
    const supabase = createClient();
    if (!supabase) {
      setSavedIds(readLocalIds());
      setReady(true);
      return;
    }
    const { data, error } = await supabase
      .from("saved_recipes")
      .select("recipe_id")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("saved_recipes select:", error.message);
      const local = readLocalIds();
      setSavedIds(local);
      setReady(true);
      return;
    }

    const cloudIds = (data ?? []).map((r) => r.recipe_id);
    const localIds = readLocalIds();
    const merged = [...new Set([...cloudIds, ...localIds])];
    const toUpload = localIds.filter((id) => !cloudIds.includes(id));

    if (toUpload.length > 0) {
      const rows = toUpload.map((recipe_id) => ({
        user_id: userId,
        recipe_id,
      }));
      const { error: upErr } = await supabase
        .from("saved_recipes")
        .insert(rows);
      if (upErr && upErr.code !== "23505") {
        console.error("saved_recipes merge insert:", upErr.message);
      }
    }

    setSavedIds((prev) => {
      // Merge cloud + local + anything added in-flight via add()
      const all = new Set([...merged, ...prev]);
      return [...all];
    });
    setReady(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userIdRef.current = user?.id ?? null;

      if (!user) {
        setSavedIds(readLocalIds());
        setReady(true);
        return;
      }

      await syncFromCloud(user.id);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      userIdRef.current = uid;
      if (!uid) {
        setSavedIds(readLocalIds());
        setReady(true);
        return;
      }
      setReady(false);
      void syncFromCloud(uid);
    });

    return () => subscription.unsubscribe();
  }, [syncFromCloud]);

  useEffect(() => {
    if (!ready) return;
    writeLocalIds(savedIds);
  }, [savedIds, ready]);

  const add = useCallback((id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    void (async () => {
      try {
        const supabase = createClient();
        if (!supabase) return;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from("saved_recipes").insert({
          user_id: user.id,
          recipe_id: id,
        });
        if (error && error.code !== "23505") {
          console.error("saved_recipes insert:", error.message);
        }
      } catch (e) {
        console.error("saved_recipes insert failed:", e);
      }
    })();
  }, []);

  const remove = useCallback((id: string) => {
    setSavedIds((prev) => prev.filter((x) => x !== id));

    void (async () => {
      try {
        const supabase = createClient();
        if (!supabase) return;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase
          .from("saved_recipes")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", id);
        if (error) {
          console.error("saved_recipes delete:", error.message);
        }
      } catch (e) {
        console.error("saved_recipes delete failed:", e);
      }
    })();
  }, []);

  const setSavedIdsPublic = useCallback(
    (value: string[] | ((prev: string[]) => string[])) => {
      setSavedIds(value);
    },
    [],
  );

  return {
    savedIds,
    add,
    remove,
    setSavedIds: setSavedIdsPublic,
    /** True after local or cloud recipe IDs are loaded */
    ready,
    /** True while loading cloud saves (signed-in) */
    loading: !ready,
  };
}
