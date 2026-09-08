"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import type { AgentsResponse, MarketplaceAgent } from "@/lib/agents/types";
import { agentPath, canActivate, hirePath } from "@/lib/format";
import { toWatchSnapshot, useWatchStore } from "@/lib/watch/store";

export default function WatchPage() {
  const items = useWatchStore((s) => s.items);
  const alerts = useWatchStore((s) => s.alerts);
  const toggle = useWatchStore((s) => s.toggle);
  const ingest = useWatchStore((s) => s.ingest);
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d: AgentsResponse) => {
        setAgents(d.agents);
        ingest(d.agents.map(toWatchSnapshot));
      })
      .catch(() => setAgents([]));
  }, [ingest]);

  const rows = items.map((w) => agents.find((a) => a.id === w.id) ?? null);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-bas-heading">Watchlist</h1>
      <p className="mt-1 max-w-xl text-sm text-bas-muted">
        Saved locally. Alerts fire when hireable, x402, live, or score change on refresh.
      </p>

      {alerts.length ? (
        <ul className="mt-4 space-y-2 rounded-[12px] bg-bas-card p-4 text-sm">
          {alerts.map((a) => (
            <li key={a.id}>{a.message}</li>
          ))}
        </ul>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-bas-muted">
          Nothing watched. Open the{" "}
          <Link href="/market" className="text-bas-primary">
            market
          </Link>{" "}
          and tap Watch.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-bas-hairline rounded-[12px] bg-bas-card">
          {items.map((w, i) => {
            const agent = rows[i];
            return (
              <li key={w.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={agentPath(w.chainId, w.tokenId)} className="font-medium text-bas-heading">
                    {w.name}
                  </Link>
                  <div className="num mt-1 text-xs text-bas-muted">
                    score {w.totalScore ? w.totalScore.toFixed(1) : "—"} ·{" "}
                    {w.hireable ? "hireable" : w.x402 ? "x402" : "listed"} ·{" "}
                    {w.live == null ? "unknown" : w.live ? "live" : "down"}
                  </div>
                </div>
                <div className="flex gap-2">
                  {agent && canActivate(agent) ? (
                    <Button href={hirePath(w.chainId, w.tokenId)} size="sm">
                      Hire
                    </Button>
                  ) : (
                    <Button href={agentPath(w.chainId, w.tokenId)} variant="secondary" size="sm">
                      View
                    </Button>
                  )}
                  <button
                    type="button"
                    className="bas-mac-chip border border-bas-hairline bg-bas-elevated"
                    onClick={() => toggle(w)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
