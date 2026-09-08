"use client";

import { useCompareStore } from "@/lib/compare/store";

export function CompareToggle({ id }: { id: string }) {
  const has = useCompareStore((s) => s.ids.includes(id));
  const toggle = useCompareStore((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      className={`inline-flex h-10 items-center rounded-[6px] px-4 text-sm font-semibold ${
        has ? "bg-bas-primary text-bas-on-primary" : "bg-bas-card text-bas-body"
      }`}
    >
      {has ? "In compare" : "Compare"}
    </button>
  );
}
