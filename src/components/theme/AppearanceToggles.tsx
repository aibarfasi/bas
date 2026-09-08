"use client";

import type { ReactNode } from "react";
import { useAppearance, type ThemeMode } from "@/lib/theme/store";

function IconMoon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[15px] w-[15px]" aria-hidden>
      <path
        fill="currentColor"
        d="M16.76 13.07A7.2 7.2 0 0 1 7.2 3.16a.4.4 0 0 0-.52-.5 8 8 0 1 0 10.65 10.66.4.4 0 0 0-.57-.25Z"
      />
    </svg>
  );
}

function IconSun() {
  return (
    <svg viewBox="0 0 20 20" className="h-[15px] w-[15px]" aria-hidden>
      <path
        fill="currentColor"
        d="M10 6.35a3.65 3.65 0 1 0 0 7.3 3.65 3.65 0 0 0 0-7.3Z"
      />
      <path
        fill="currentColor"
        d="M10 2.4a.7.7 0 0 1 .7.7v1.2a.7.7 0 1 1-1.4 0V3.1a.7.7 0 0 1 .7-.7Zm0 12.6a.7.7 0 0 1 .7.7v1.2a.7.7 0 1 1-1.4 0v-1.2a.7.7 0 0 1 .7-.7ZM17.6 10a.7.7 0 0 1-.7.7h-1.2a.7.7 0 1 1 0-1.4h1.2a.7.7 0 0 1 .7.7ZM4.3 10a.7.7 0 0 1-.7.7H2.4a.7.7 0 1 1 0-1.4h1.2a.7.7 0 0 1 .7.7Zm10.98-5.28a.7.7 0 0 1 0 .99l-.85.85a.7.7 0 1 1-.99-.99l.85-.85a.7.7 0 0 1 .99 0ZM5.56 13.44a.7.7 0 0 1 0 .99l-.85.85a.7.7 0 1 1-.99-.99l.85-.85a.7.7 0 0 1 .99 0Zm8.88.99a.7.7 0 0 1-.99 0l-.85-.85a.7.7 0 1 1 .99-.99l.85.85a.7.7 0 0 1 0 .99ZM6.41 6.56a.7.7 0 0 1-.99 0l-.85-.85a.7.7 0 0 1 .99-.99l.85.85a.7.7 0 0 1 0 .99Z"
      />
    </svg>
  );
}

function Seg({
  mode,
  active,
  children,
}: {
  mode: ThemeMode;
  active: boolean;
  children: ReactNode;
}) {
  const setTheme = useAppearance((s) => s.setTheme);
  return (
    <button
      type="button"
      onClick={() => setTheme(mode)}
      aria-pressed={active}
      aria-label={`${mode === "dark" ? "Dark" : "Light"} appearance`}
      title={mode === "dark" ? "Dark" : "Light"}
      className={`relative z-10 inline-flex h-full flex-1 items-center justify-center rounded-full transition-colors duration-200 ${
        active ? "text-bas-heading" : "text-bas-muted hover:text-bas-heading"
      }`}
    >
      {children}
    </button>
  );
}

export function AppearanceToggles({ className = "" }: { className?: string }) {
  const theme = useAppearance((s) => s.theme);
  const light = theme === "light";

  return (
    <div
      role="group"
      aria-label="Appearance"
      className={`relative inline-flex h-8 w-[68px] shrink-0 items-stretch rounded-full p-[3px] ${className}`}
      style={{
        background: light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
        boxShadow: light ? "inset 0 1px 2px rgba(0,0,0,0.06)" : "inset 0 1px 2px rgba(0,0,0,0.35)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-full transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          transform: light ? "translateX(100%)" : "translateX(0)",
          background: light ? "#ffffff" : "rgba(255,255,255,0.22)",
          boxShadow: light
            ? "0 1px 2px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)"
            : "0 1px 2px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.18)",
        }}
      />
      <Seg mode="dark" active={!light}>
        <IconMoon />
      </Seg>
      <Seg mode="light" active={light}>
        <IconSun />
      </Seg>
    </div>
  );
}
