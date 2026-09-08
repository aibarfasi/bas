"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Toast = { id: string; kind: "ok" | "err"; text: string };

const Ctx = createContext<(kind: Toast["kind"], text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItems((cur) => [...cur, { id, kind, text }].slice(-4));
    window.setTimeout(() => {
      setItems((cur) => cur.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 z-50 flex flex-col gap-2 bottom-[max(1rem,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-4 md:right-4 md:w-80">
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-[8px] border px-3.5 py-2.5 text-[13px] tracking-[-0.01em] backdrop-blur-xl backdrop-saturate-150 ${
              t.kind === "ok"
                ? "border-bas-up/30 bg-bas-surface-soft/90 text-bas-heading"
                : "border-bas-down/30 bg-bas-surface-soft/90 text-bas-heading"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
