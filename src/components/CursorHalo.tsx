"use client";

import { useEffect, useRef, useState } from "react";

export function CursorHalo() {
  const haloRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label, [data-cursor-hover]";

    const onOverCapture = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest?.(INTERACTIVE)) setHovering(true);
    };
    const onOutCapture = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest?.(INTERACTIVE)) setHovering(false);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onOverCapture, true);
    document.addEventListener("mouseout", onOutCapture, true);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const loop = () => {
      pos.current.x = lerp(pos.current.x, mouse.current.x, 0.15);
      pos.current.y = lerp(pos.current.y, mouse.current.y, 0.15);

      if (haloRef.current) {
        haloRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onOverCapture, true);
      document.removeEventListener("mouseout", onOutCapture, true);
    };
  }, [visible]);

  const [gi, gm] = clicking ? ([82, 44] as const) : hovering ? ([78, 38] as const) : ([72, 34] as const);
  const gradient = `radial-gradient(
            circle,
            color-mix(in srgb, var(--primary) ${gi}%, transparent) 0%,
            color-mix(in srgb, var(--primary) ${gm}%, transparent) 40%,
            transparent 70%
          )`;

  /** Foreground + background rings: contrast on primary-pink buttons without mix-blend. */
  const haloRim = `0 0 0 1px color-mix(in srgb, var(--foreground) 50%, transparent), 0 0 0 2px color-mix(in srgb, var(--background) 65%, transparent), 0 0 26px color-mix(in srgb, var(--primary) 32%, transparent)`;

  return (
    <>
      {/* Pink halo + theme rim so it stays readable on pink CTAs */}
      <div
        ref={haloRef}
        className="pointer-events-none fixed top-0 left-0 z-110000 rounded-full"
        aria-hidden
        style={{
          width: hovering ? 60 : 40,
          height: hovering ? 60 : 40,
          background: gradient,
          boxShadow: haloRim,
          opacity: visible ? (clicking ? 0.66 : hovering ? 0.56 : 0.46) : 0,
          transition: "width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out",
          willChange: "transform",
        }}
      />
    </>
  );
}
