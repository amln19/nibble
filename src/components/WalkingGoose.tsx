"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Lottie from "lottie-react";
import gooseAnimation from "@/../public/animations/goose.json";

const FADE_DISTANCE = 180;
const RIGHT_DONUT_OFFSET = 80; // from right edge; larger = donut sits slightly left
const LEFT_DONUT_X = 510; // fixed px position for left donut, just right of title
// Where the goose turns around on the left — just past the title text
const LEFT_BOUNDARY = 510;
const INITIAL_POSITION = 560;

type Direction = "right" | "left";

type GooseState = { position: number; direction: Direction };

function tickReducer(state: GooseState, width: number): GooseState {
  const { position, direction } = state;
  if (direction === "right") {
    if (position >= width - 100) {
      return { position: position - 2, direction: "left" };
    }
    return { position: position + 2, direction };
  }
  if (position <= LEFT_BOUNDARY) {
    return { position: position + 2, direction: "right" };
  }
  return { position: position - 2, direction };
}

export function WalkingGoose() {
  const [{ position, direction }, dispatchTick] = useReducer(
    (s: GooseState, cw: number) => tickReducer(s, cw),
    { position: INITIAL_POSITION, direction: "right" },
  );
  const [containerWidth, setContainerWidth] = useState(1000);
  const containerWidthRef = useRef(containerWidth);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerWidthRef.current = containerWidth;
  }, [containerWidth]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const frame = window.requestAnimationFrame(() => {
      setContainerWidth(node.offsetWidth || 1000);
    });

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      setContainerWidth(
        width ? Math.round(width) : node.offsetWidth || 1000,
      );
    });
    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatchTick(containerWidthRef.current);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const rightEdge = containerWidth - RIGHT_DONUT_OFFSET;
  const leftTarget = LEFT_DONUT_X;

  let donutX: number;
  let donutOpacity: number;

  if (direction === "right") {
    donutX = rightEdge;
    const dist = rightEdge - position;
    donutOpacity = Math.min(1, Math.max(0, dist / FADE_DISTANCE));
  } else {
    donutX = leftTarget;
    const dist = position - leftTarget;
    donutOpacity = Math.min(1, Math.max(0, dist / FADE_DISTANCE));
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute left-0 top-0 h-full w-full"
    >
      {/* Donut target */}
      <div
        className="absolute top-1/2"
        style={{
          left: `${donutX}px`,
          transform: "translateY(-50%)",
          opacity: donutOpacity,
          transition: "opacity 0.15s ease-out",
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 100 100"
          className="h-9 w-9 sm:h-11 sm:w-11 drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform:
              direction === "left" ? "rotate(-15deg)" : "rotate(15deg)",
          }}
        >
          {/* Dark outline/shadow for depth */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M50 90C72.0914 90 90 72.0914 90 50C90 27.9086 72.0914 10 50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90ZM50 68C59.9411 68 68 59.9411 68 50C68 40.0589 59.9411 32 50 32C40.0589 32 32 40.0589 32 50C32 59.9411 40.0589 68 50 68Z"
            fill="#a66e38"
          />

          {/* Dough base */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M50 86C69.8823 86 86 69.8823 86 50C86 30.1177 69.8823 14 50 14C30.1177 14 14 30.1177 14 50C14 69.8823 30.1177 86 50 86ZM50 68C59.9411 68 68 59.9411 68 50C68 40.0589 59.9411 32 50 32C40.0589 32 32 40.0589 32 50C32 59.9411 40.0589 68 50 68Z"
            fill="#E8B57D"
          />

          {/* Pink Glaze with a wavy drippy bottom */}
          <path
            d="M50 14 C70 14 86 30 86 50 C86 56 84 62 80 66 C77 69 72 68 69 64 C66 60 62 58 58 60 C54 62 52 68 48 68 C44 68 42 62 38 60 C34 58 30 60 27 64 C24 68 19 69 16 66 C12 62 10 56 10 50 C10 30 26 14 50 14 ZM50 30 C39 30 30 39 30 50 C30 61 39 70 50 70 C61 70 70 61 70 50 C70 39 61 30 50 30Z"
            fill="var(--primary)"
            fillRule="evenodd"
            clipRule="evenodd"
          />

          {/* Glaze highlight (subtle shine at top right) */}
          <path
            d="M68 28 A32 32 0 0 0 28 40"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.35"
            fill="none"
          />

          {/* Inner hole dark shadow to give it 3D depth */}
          <circle cx="50" cy="50" r="18" fill="#1A0D12" opacity="0.15" />

          {/* Sprinkles (bright colors, fun angles) */}
          <rect
            x="35"
            y="24"
            width="8"
            height="3.5"
            rx="1.75"
            fill="#00E5FF"
            transform="rotate(30 35 24)"
          />
          <rect
            x="62"
            y="28"
            width="8"
            height="3.5"
            rx="1.75"
            fill="#FFEB3B"
            transform="rotate(-45 62 28)"
          />
          <rect
            x="76"
            y="44"
            width="8"
            height="3.5"
            rx="1.75"
            fill="#FFFFFF"
            transform="rotate(15 76 44)"
          />
          <rect
            x="22"
            y="45"
            width="8"
            height="3.5"
            rx="1.75"
            fill="#00FF7F"
            transform="rotate(75 22 45)"
          />
          <rect
            x="30"
            y="60"
            width="8"
            height="3.5"
            rx="1.75"
            fill="#FFFFFF"
            transform="rotate(-20 30 60)"
          />
          <rect
            x="52"
            y="65"
            width="8"
            height="3.5"
            rx="1.75"
            fill="#00E5FF"
            transform="rotate(-60 52 65)"
          />
          <rect
            x="70"
            y="58"
            width="8"
            height="3.5"
            rx="1.75"
            fill="#FFEB3B"
            transform="rotate(50 70 58)"
          />
          <rect
            x="48"
            y="18"
            width="8"
            height="3.5"
            rx="1.75"
            fill="#00FF7F"
            transform="rotate(-10 48 18)"
          />
        </svg>
      </div>

      {/* Goose */}
      <div
        className="absolute top-1/2"
        style={{
          left: `${position}px`,
          transform: `translateY(-50%) scaleX(${direction === "right" ? "-1" : "1"})`,
        }}
      >
        <div className="h-12 w-12 sm:h-16 sm:w-16">
          <Lottie
            animationData={gooseAnimation}
            loop={true}
            autoplay={true}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
