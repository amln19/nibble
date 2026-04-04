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

  return (
    <>
      {/* Halo — trails the cursor with lerp */}
      <div
        ref={haloRef}
        className="pointer-events-none fixed top-0 left-0 z-9999 rounded-full"
        style={{
          width: hovering ? 56 : 36,
          height: hovering ? 56 : 36,
          background: `radial-gradient(circle, var(--primary) 0%, transparent 70%)`,
          opacity: visible ? (clicking ? 0.55 : hovering ? 0.45 : 0.35) : 0,
          transition: "width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out",
          willChange: "transform",
        }}
      />
    </>
  );
}
