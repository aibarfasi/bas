"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { LiveBadge } from "@/components/ui/Badge";
import { useCompareStore } from "@/lib/compare/store";
import type { AgentsResponse, MarketplaceAgent } from "@/lib/agents/types";
import { agentPath, formatPct, formatUsd, hirePath } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

export default function ComparePage() {
  const ids = useCompareStore((s) => s.ids);
  const clear = useCompareStore((s) => s.clear);
  const toggle = useCompareStore((s) => s.toggle);
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d: AgentsResponse) => {
        setAgents(d.agents.filter((a) => ids.includes(a.id)));
      })
      .catch(() => setAgents([]));
  }, [ids]);

  return (
    <AppShell>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-bas-heading">Compare</h1>
          <p className="mt-1 text-sm text-bas-muted">
            Two or three agents. Same fields. Hire the one you can defend.
          </p>
        </div>
        {ids.length ? (
          <button type="button" onClick={clear} className="text-sm text-bas-muted">
            Clear
          </button>
        ) : null}
      </div>

      {ids.length === 0 ? (
        <p className="mt-10 text-sm text-bas-muted">
          Nothing selected. Open the{" "}
          <Link href="/market" className="text-bas-primary">
            market
          </Link>{" "}
          and tap Compare.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr>
                <th className="py-3 text-left text-xs font-medium text-bas-muted">Field</th>
                {agents.map((a) => (
                  <th key={a.id} className="py-3 text-left">
                    <Link href={agentPath(a.chainId, a.tokenId)} className="text-bas-heading">
                      {a.name}
                    </Link>
                    <div className="mt-1">
                      <LiveBadge live={a.live} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows(agents).map((row) => (
                <tr key={row.k} className="border-t border-bas-hairline">
                  <td className="py-3 text-bas-muted">{row.k}</td>
                  {row.vs.map((v, i) => (
                    <td key={`${row.k}-${i}`} className={`py-3 ${row.mono ? "num" : ""}`}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-bas-hairline">
                <td className="py-4" />
                {agents.map((a) => (
                  <td key={a.id} className="py-4">
                    <div className="flex flex-wrap gap-2">
                      {a.hireable ? (
                        <Button href={hirePath(a.chainId, a.tokenId)}>Hire</Button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggle(a.id)}
                        className="h-10 rounded-[6px] bg-bas-card px-3 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function rows(agents: MarketplaceAgent[]) {
  return [
    { k: "Category", vs: agents.map((a) => categoryLabel(a.category)) },
    { k: "Score", vs: agents.map((a) => (a.totalScore ? a.totalScore.toFixed(1) : "—")), mono: true },
    {
      k: "Win rate",
      vs: agents.map((a) =>
        a.metrics.winRate != null ? `${a.metrics.winRate.toFixed(1)}%` : "—",
      ),
      mono: true,
    },
    { k: "PnL", vs: agents.map((a) => formatPct(a.metrics.pnlPct)), mono: true },
    {
      k: "Max DD",
      vs: agents.map((a) =>
        a.metrics.maxDrawdown != null ? `${a.metrics.maxDrawdown.toFixed(1)}%` : "—",
      ),
      mono: true,
    },
    { k: "Window", vs: agents.map((a) => a.metrics.window ?? "—") },
    { k: "Venue", vs: agents.map((a) => a.metrics.venue ?? "—") },
    { k: "Risk", vs: agents.map((a) => a.metrics.risk ?? "—") },
    { k: "Price", vs: agents.map((a) => formatUsd(a.priceUsd)), mono: true },
    { k: "x402", vs: agents.map((a) => (a.x402 ? "Yes" : "No")) },
    { k: "Hireable", vs: agents.map((a) => (a.hireable ? "Yes" : "No")) },
  ];
}
