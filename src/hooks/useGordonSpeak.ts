"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type GordonSpeakResult = { ok: true } | { ok: false; status: number };

/**
 * Gordon TTS via /api/gordon/speak — same pipeline as cook mode.
 * Honors `muted` synchronously through a ref so speak() always sees latest value.
 */
export function useGordonSpeak(muted: boolean) {
  const mutedRef = useRef(muted);
  useLayoutEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const speakFetchAbortRef = useRef<AbortController | null>(null);
  const speakGenerationRef = useRef(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cancelPendingSpeak = useCallback(() => {
    speakFetchAbortRef.current?.abort();
    speakFetchAbortRef.current = null;
    speakGenerationRef.current += 1;
  }, []);

  const stop = useCallback(() => {
    cancelPendingSpeak();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, [cancelPendingSpeak]);

  const speak = useCallback(
    async (text: string): Promise<GordonSpeakResult> => {
      if (!text.trim() || mutedRef.current) return { ok: true };
      cancelPendingSpeak();
      const gen = speakGenerationRef.current;
      const ac = new AbortController();
      speakFetchAbortRef.current = ac;
      setIsSpeaking(true);
      try {
        const res = await fetch("/api/gordon/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: ac.signal,
        });
        if (gen !== speakGenerationRef.current) {
          setIsSpeaking(false);
          return { ok: false, status: 0 };
        }
        if (!res.ok) {
          setIsSpeaking(false);
          return { ok: false, status: res.status };
        }
        const blob = await res.blob();
        if (gen !== speakGenerationRef.current) {
          setIsSpeaking(false);
          return { ok: false, status: 0 };
        }
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = url;
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.onerror = () => setIsSpeaking(false);
        await audioRef.current.play();
        if (gen !== speakGenerationRef.current) {
          audioRef.current.pause();
          audioRef.current.removeAttribute("src");
          audioRef.current.load();
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          setIsSpeaking(false);
          return { ok: false, status: 0 };
        }
        return { ok: true };
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setIsSpeaking(false);
          return { ok: false, status: 0 };
        }
        setIsSpeaking(false);
        return { ok: false, status: 0 };
      }
    },
    [cancelPendingSpeak],
  );

  useEffect(() => {
    return () => {
      speakFetchAbortRef.current?.abort();
      speakFetchAbortRef.current = null;
      speakGenerationRef.current += 1;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  return { speak, stop, isSpeaking, cancelPendingSpeak };
}
