"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

export function MarketSwitch({
  paused,
  onConfirm,
}: {
  paused: boolean;
  onConfirm: (nextPaused: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const nextPaused = !paused;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm(nextPaused);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open
        ? createPortal(
            <button
              type="button"
              className="fixed inset-0 z-40 bg-bas-overlay"
              aria-label="Dismiss"
              disabled={busy}
              onClick={() => {
                if (!busy) setOpen(false);
              }}
            />,
            document.body,
          )
        : null}
      <div ref={root} className={`relative ${open ? "z-50" : ""}`}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((v) => !v)}
          className={`bas-mac-chip gap-2 border ${
            paused
              ? "border-bas-down/40 bg-bas-down/10 text-bas-down"
              : "border-bas-up/40 bg-bas-up/10 text-bas-up"
          }`}
        >
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              paused ? "bg-bas-down/40" : "bg-bas-up"
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] ${
                paused ? "left-0.5" : "left-[18px]"
              }`}
            />
          </span>
          <span className="hidden font-medium sm:inline">{paused ? "Paused" : "Market open"}</span>
        </button>
        {open ? (
          <div
            role="dialog"
            aria-label={paused ? "Open the market" : "Pause the market"}
            className="admin-panel absolute right-0 top-[calc(100%+8px)] z-50 w-[min(18.5rem,calc(100vw-2rem))] rounded-[12px] border border-bas-hairline bg-bas-surface-soft p-3.5"
          >
            <span className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 border-t border-l border-bas-hairline bg-bas-surface-soft" />
            <p className="relative text-sm font-semibold text-bas-heading">
              {paused ? "Open the market?" : "Pause the market?"}
            </p>
            <p className="relative mt-1 text-xs leading-5 text-bas-muted">
              {paused
                ? "The public catalog will accept traffic again. The maintenance banner comes down."
                : "Visitors will see a maintenance banner. Existing sessions stay in the console."}
            </p>
            <div className="relative mt-3 flex justify-end gap-1.5">
              <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant={paused ? "primary" : "danger"}
                disabled={busy}
                onClick={() => void confirm()}
              >
                {busy ? "Saving…" : paused ? "Open market" : "Pause market"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
