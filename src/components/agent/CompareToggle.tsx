"use client";

import { useCompareStore } from "@/lib/compare/store";

export function CompareToggle({ id }: { id: string }) {
  const has = useCompareStore((s) => s.ids.includes(id));
  const toggle = useCompareStore((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      className={`bas-mac-chip border ${
        has
          ? "border-transparent bg-bas-primary text-bas-on-primary"
          : "border-bas-hairline bg-bas-card text-bas-body hover:bg-bas-elevated"
      }`}
    >
      {has ? "In compare" : "Compare"}
    </button>
  );
}
