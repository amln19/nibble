"use client";

import { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";
import gooseAnimation from "@/../public/animations/goose.json";

export function WalkingGoose() {
  const startPosition = 550; // Start after the title text (approximate width)
  const [position, setPosition] = useState(startPosition);
  const [direction, setDirection] = useState<"right" | "left">("right");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        const containerWidth = containerRef.current?.offsetWidth || 1000;

        if (direction === "right") {
          // Walking to the right
          if (prev >= containerWidth - 100) {
            // Reached the right edge, turn around
            setDirection("left");
            return prev - 2;
          }
          return prev + 2;
        } else {
          // Walking to the left
          if (prev <= startPosition) {
            // Reached the start position, turn around
            setDirection("right");
            return prev + 2;
          }
          return prev - 2;
        }
      });
    }, 30); // Update every 30ms for smooth animation

    return () => clearInterval(interval);
  }, [direction]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute left-0 top-0 h-full w-full"
    >
      <div
        className="absolute top-1/2"
        style={{
          left: `${position}px`,
          transform: `translateY(-50%) scaleX(${direction === "right" ? "-1" : "1"})`, // Flip based on direction
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
