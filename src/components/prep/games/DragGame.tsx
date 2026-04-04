"use client";

import { useRef, useState } from "react";
import type { DragStep, StepResult } from "@/lib/gordon/simulation-types";

type Props = {
  step: DragStep;
  onComplete: (result: StepResult) => void;
};

export function DragGame({ step, onComplete }: Props) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const origin = useRef({ x: 0, y: 0 });
  const latest = useRef({ x: 0, y: 0 });
  const targetRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  function isOverTarget(clientX: number, clientY: number) {
    if (!targetRef.current) return false;
    const r = targetRef.current.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (done) return;
    setDragging(true);
    origin.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const next = { x: e.clientX - origin.current.x, y: e.clientY - origin.current.y };
    latest.current = next;
    setOffset(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging || completedRef.current) return;
    setDragging(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }

    if (isOverTarget(e.clientX, e.clientY)) {
      completedRef.current = true;
      setDone(true);
      setTimeout(() => {
        onComplete({ perfect: true, message: "Workspace ready — let's cook!" });
      }, 500);
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }

  const overTarget = dragging && targetRef.current && (() => {
    const r = targetRef.current!.getBoundingClientRect();
    const itemX = r.left + r.width / 2;
    const itemY = r.top + r.height / 2;
    const dx = Math.abs(latest.current.x);
    const dy = Math.abs(latest.current.y);
    return dx < r.width && dy < r.height;
  })();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Target zone */}
      <div
        ref={targetRef}
        className={`flex h-28 w-56 items-center justify-center rounded-3xl border-3 border-dashed transition-all sm:h-32 sm:w-64 ${
          done
            ? "border-emerald-500 bg-emerald-500/15"
            : overTarget
              ? "border-primary bg-primary/10 scale-105"
              : "border-edge bg-surface prep-drag-pulse"
        }`}
      >
        {done ? (
          <div className="flex flex-col items-center gap-1 prep-success-pop">
            <span className="text-4xl">{step.itemEmoji}</span>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Placed! ✓</span>
          </div>
        ) : (
          <span className="text-sm font-extrabold text-muted">{step.targetLabel}</span>
        )}
      </div>

      {/* Arrow hint */}
      {!done && !dragging && (
        <span className="text-lg text-muted animate-bounce">↑ drag here</span>
      )}

      {/* Draggable item */}
      {!done && (
        <div
          className={`flex h-24 w-24 cursor-grab touch-none select-none items-center justify-center rounded-3xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)] transition-shadow sm:h-28 sm:w-28 ${
            dragging ? "cursor-grabbing shadow-[0_8px_16px_rgba(0,0,0,0.15)]" : ""
          }`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            touchAction: "none",
            zIndex: dragging ? 50 : 1,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="text-5xl">{step.itemEmoji}</span>
        </div>
      )}
    </div>
  );
}
