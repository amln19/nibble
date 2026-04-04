"use client";

import { useEffect, useState } from "react";

/**
 * Duck footprint — 3 round wide toes on a fat oval heel pad,
 * matching the reference (golden warm blobs, clear V-gaps between toes).
 */
function Footprint({ flipped = false, color = "#f5b642" }: { flipped?: boolean; color?: string }) {
  return (
    <svg
      viewBox="-2 -2 56 68"
      fill={color}
      width="100%"
      height="100%"
      style={{ transform: flipped ? "scaleX(-1)" : undefined, display: "block" }}
    >
      {/* Left toe — angled left */}
      <ellipse cx="7" cy="22" rx="9" ry="14" transform="rotate(-22 7 22)" />
      {/* Middle toe — straight up, tallest */}
      <ellipse cx="26" cy="15" rx="9" ry="17" />
      {/* Right toe — angled right */}
      <ellipse cx="45" cy="22" rx="9" ry="14" transform="rotate(22 45 22)" />
      {/* Connector block — merges toes into the heel, hides nothing above y≈30 so V-gaps stay visible */}
      <rect x="3" y="29" width="46" height="13" rx="7" />
      {/* Heel pad oval */}
      <ellipse cx="26" cy="50" rx="20" ry="14" />
    </svg>
  );
}

const STEP_COUNT = 7; // number of footprints in the trail
const STEP_DELAY = 280; // ms between each footprint appearing
const HOLD_MS = 1600; // how long full trail stays visible
const FADE_MS = 600; // fade-out duration
const PAUSE_MS = 2200; // pause before next cycle

export function FootprintTrail() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function cycle() {
      while (!cancelled) {
        // reveal footprints one by one
        for (let i = 1; i <= STEP_COUNT; i++) {
          if (cancelled) return;
          setVisibleCount(i);
          await sleep(STEP_DELAY);
        }
        await sleep(HOLD_MS);
        if (cancelled) return;
        // fade out all at once
        setFading(true);
        await sleep(FADE_MS);
        if (cancelled) return;
        setVisibleCount(0);
        setFading(false);
        await sleep(PAUSE_MS);
      }
    }

    // small initial delay before first cycle
    const t = setTimeout(() => cycle(), 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      className="pointer-events-none flex items-end gap-1 sm:gap-2"
      style={{
        opacity: fading ? 0 : 1,
        transition: fading ? `opacity ${FADE_MS}ms ease` : "none",
      }}
    >
      {Array.from({ length: STEP_COUNT }).map((_, i) => {
        // alternate: even = right foot tilted right, odd = left foot tilted left
        const isRight = i % 2 === 0;
        const tiltDeg = isRight ? 12 : -12;
        // slight vertical stagger to mimic a stride
        const yOffset = isRight ? 0 : -6;

        return (
          <div
            key={i}
            style={{
              width: 28,
              height: 34,
              flexShrink: 0,
              transform: `translateY(${yOffset}px) rotate(${tiltDeg}deg)`,
              opacity: i < visibleCount ? 1 : 0,
              transition: "opacity 0.18s ease",
            }}
          >
            <Footprint flipped={!isRight} />
          </div>
        );
      })}
    </div>
  );
}
