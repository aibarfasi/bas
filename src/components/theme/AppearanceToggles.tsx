"use client";

import type { ReactNode } from "react";
import { useAppearance, type ThemeMode } from "@/lib/theme/store";

function IconSun({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3.5v1.8M12 18.7V20.5M4.7 4.7l1.3 1.3M18 18l1.3 1.3M3.5 12h1.8M18.7 12H20.5M4.7 19.3 6 18M18 6l1.3-1.3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M16.5 13.2A6.6 6.6 0 0 1 10.8 6.4 6.7 6.7 0 1 0 16.5 13.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModeBtn({
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
      aria-label={`${mode} theme`}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] px-2.5 text-xs font-medium transition-colors ${
        active ? "bg-bas-primary text-bas-on-primary" : "text-bas-muted hover:text-bas-heading"
      }`}
    >
      {children}
    </button>
  );
}

export function AppearanceToggles({ className = "" }: { className?: string }) {
  const theme = useAppearance((s) => s.theme);

  return (
    <div
      role="group"
      aria-label="Theme"
      className={`inline-flex h-10 items-center rounded-[8px] border border-bas-hairline bg-bas-field p-0.5 ${className}`}
    >
      <ModeBtn mode="dark" active={theme === "dark"}>
        <IconMoon />
        <span className="hidden sm:inline">Dark</span>
      </ModeBtn>
      <ModeBtn mode="light" active={theme === "light"}>
        <IconSun />
        <span className="hidden sm:inline">Light</span>
      </ModeBtn>
    </div>
  );
}
