"use client";

import { useAppearance } from "@/lib/theme/store";

type Props = {
  compact?: boolean;
  className?: string;
};

export function BasLogo({ compact = false, className = "h-8 w-auto" }: Props) {
  const theme = useAppearance((s) => s.theme);
  const src = compact
    ? "/bas-mark.svg?v=lazy2"
    : theme === "light"
      ? "/bas-logo-light.svg?v=lazy2"
      : "/bas-logo.svg?v=lazy2";

  return (
    <img
      src={src}
      alt="BAS marketplace"
      className={className}
      width={compact ? 32 : 196}
      height={32}
    />
  );
}
