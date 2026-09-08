"use client";

import { useEffect, type ReactNode } from "react";
import { applyAppearance, useAppearance } from "@/lib/theme/store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppearance((s) => s.theme);

  useEffect(() => {
    applyAppearance(theme);
  }, [theme]);

  return <>{children}</>;
}

export const appearanceBootScript = `(function(){try{var r=JSON.parse(localStorage.getItem("bas-appearance")||"{}");var t=(r.state&&r.state.theme)||"dark";var e=document.documentElement;e.dataset.theme=t;delete e.dataset.glass;e.style.colorScheme=t;e.classList.toggle("dark",t==="dark");}catch(e){document.documentElement.dataset.theme="dark";}})();`;
