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
      className={`bas-mac-chip border ${
        has
          ? "border-transparent bg-bas-primary text-bas-on-primary"
          : "border-bas-hairline bg-bas-card text-bas-body hover:bg-bas-elevated"
      }`}
    >
      {has ? "Watching" : "Watch"}
    </button>
  );
}
