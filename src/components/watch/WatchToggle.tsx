"use client";

import { toWatchSnapshot, useWatchStore } from "@/lib/watch/store";
import type { MarketplaceAgent } from "@/lib/agents/types";

export function WatchToggle({ agent }: { agent: MarketplaceAgent }) {
  const has = useWatchStore((s) => s.has(agent.id));
  const toggle = useWatchStore((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={() => toggle(toWatchSnapshot(agent))}
      className={`inline-flex h-10 items-center rounded-[6px] px-4 text-sm font-semibold ${
        has ? "bg-bas-primary text-bas-on-primary" : "bg-bas-card text-bas-body"
      }`}
    >
      {has ? "Watching" : "Watch"}
    </button>
  );
}
