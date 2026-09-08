"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconChevron } from "@/components/admin/icons";

export type AdminSelectOption<T extends string = string> = { id: T; label: string };

export function AdminSelect<T extends string>({
  value,
  onChange,
  options,
  disabled,
  className = "",
  size = "md",
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: AdminSelectOption<T>[];
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.id === value);
  const compact = size === "sm";

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        btn.current?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const i = options.findIndex((o) => o.id === value);
        const next =
          e.key === "ArrowDown"
            ? options[Math.min(options.length - 1, Math.max(0, i) + 1)]
            : options[Math.max(0, (i < 0 ? 1 : i) - 1)];
        if (next) onChange(next.id);
      }
    }
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btn.current?.contains(t) || menu.current?.contains(t)) return;
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDoc);
    };
  }, [open, options, value, onChange]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btn}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`admin-field flex w-full items-center justify-between gap-2 text-left disabled:opacity-50 ${
          compact ? "h-8 px-2.5 text-[13px]" : "h-9 px-3 text-[13px]"
        }`}
      >
        <span className="min-w-0 truncate">{selected?.label ?? value}</span>
        <IconChevron className={`h-3.5 w-3.5 shrink-0 text-bas-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          ref={menu}
          id={listId}
          role="listbox"
          className="admin-select-menu absolute z-30 mt-1.5 max-h-60 w-full min-w-[11rem] overflow-auto rounded-[8px] p-1.5"
        >
          {options.map((o) => {
            const on = o.id === value;
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={on}
                className={`flex min-h-8 w-full items-center rounded-[6px] px-2.5 text-left text-[13px] tracking-[-0.01em] ${
                  on
                    ? "bg-bas-primary text-bas-on-primary"
                    : "text-bas-heading hover:bg-bas-elevated"
                }`}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
