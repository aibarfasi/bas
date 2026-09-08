"use client";

import { useAppearance } from "@/lib/theme/store";

export function AppearanceToggles() {
  const theme = useAppearance((s) => s.theme);
  const toggleTheme = useAppearance((s) => s.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "light"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] text-sm text-bas-muted hover:bg-bas-card hover:text-bas-heading"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
