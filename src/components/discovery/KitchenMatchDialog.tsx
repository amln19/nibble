"use client";

import type { SmartFilters } from "@/lib/recipes";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FilterChips } from "./FilterChips";
import { PantryPanel } from "./PantryPanel";

type Props = {
  open: boolean;
  onClose: () => void;
  pantryMode: boolean;
  onPantryModeChange: (on: boolean) => void;
  pantryItems: string[];
  onAddPantry: (item: string) => void;
  onRemovePantry: (item: string) => void;
  smart: SmartFilters;
  onSmartChange: (next: SmartFilters) => void;
  showPantryHint: boolean;
};

export function KitchenMatchDialog({
  open,
  onClose,
  pantryMode,
  onPantryModeChange,
  pantryItems,
  onAddPantry,
  onRemovePantry,
  smart,
  onSmartChange,
  showPantryHint,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open) return;
    const d = dialogRef.current;
    if (!d) return;
    d.showModal();
    return () => {
      if (d.open) d.close();
    };
  }, [open]);

  function requestClose() {
    onCloseRef.current();
  }

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const t = e.target as HTMLElement;
    if (t.closest("[data-kitchen-sheet]")) return;
    requestClose();
  }

  if (!open) return null;

  const sheet = (
    <dialog
      ref={dialogRef}
      className="kitchen-match-dialog fixed inset-0 z-[9998] m-0 flex max-h-none min-h-full w-full max-w-none min-w-full flex-col items-stretch justify-end bg-transparent p-0 sm:items-center sm:justify-center sm:p-4"
      onClick={handleDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      aria-labelledby="kitchen-match-title"
      aria-modal="true"
    >
      <div
        data-kitchen-sheet
        className="flex max-h-[min(88vh,760px)] w-full max-w-lg flex-col rounded-t-3xl border-2 border-zinc-200 bg-white shadow-xl sm:max-h-[min(92vh,820px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b-2 border-zinc-100 bg-pink-50 px-5 py-4 rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl" aria-hidden>✳</span>
            <div className="min-w-0">
              <h2
                id="kitchen-match-title"
                className="text-base font-extrabold text-zinc-900"
              >
                Match your kitchen
              </h2>
              <p className="text-xs font-medium text-zinc-500">
                Pantry + smart filters shape your swipe deck.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white text-lg font-bold text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              requestClose();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          <div className="space-y-5">
            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-[0_3px_0_#e4e4e7]">
              <PantryPanel
                pantryMode={pantryMode}
                onPantryModeChange={onPantryModeChange}
                pantryItems={pantryItems}
                onAdd={onAddPantry}
                onRemove={onRemovePantry}
                embedded
              />
            </div>

            {showPantryHint ? (
              <div className="rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-3">
                <p className="text-xs font-bold text-pink-800">
                  💡 Add ingredients above so we can match what you have!
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-[0_3px_0_#e4e4e7]">
              <FilterChips value={smart} onChange={onSmartChange} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t-2 border-zinc-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={requestClose}
            className="w-full rounded-2xl border-2 border-pink-600 bg-pink-500 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_#be185d] transition-all hover:bg-pink-400 active:translate-y-1 active:shadow-none"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );

  return createPortal(sheet, document.body);
}
