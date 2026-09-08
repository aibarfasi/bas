"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { LiveBadge } from "@/components/ui/Badge";
import { useCompareStore } from "@/lib/compare/store";
import type { AgentsResponse, MarketplaceAgent } from "@/lib/agents/types";
import { agentPath, canActivate, formatPct, formatUsd, hireCta, hirePath } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { BRIEF_COMPARE_HREF, COMPARE_LIMIT } from "@/lib/compare/sellers";

export default function ComparePage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-bas-muted">Loading compare…</p>}>
        <CompareView />
      </Suspense>
    </AppShell>
  );
}

function CompareView() {
  const ids = useCompareStore((s) => s.ids);
  const clear = useCompareStore((s) => s.clear);
  const toggle = useCompareStore((s) => s.toggle);
  const setIds = useCompareStore((s) => s.setIds);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [copied, setCopied] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const q = params.get("ids");
    if (q) {
      const parsed = q
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, COMPARE_LIMIT);
      if (parsed.length) setIds(parsed);
    }
    hydrated.current = true;
    // URL is the share contract; persist store follows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const next = ids.length ? `${pathname}?ids=${encodeURIComponent(ids.join(","))}` : pathname;
    router.replace(next, { scroll: false });
  }, [ids, pathname, router]);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d: AgentsResponse) => {
        setAgents(d.agents.filter((a) => ids.includes(a.id)));
      })
      .catch(() => setAgents([]));
  }, [ids]);

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-bas-heading">Compare</h1>
          <p className="mt-1 text-sm text-bas-muted">
            Up to four agents — one per brief category. Same fields. The URL is shareable.
          </p>
        </div>
        <div className="flex gap-3">
          {ids.length ? (
            <button type="button" onClick={share} className="text-sm text-bas-primary">
              {copied ? "Copied" : "Copy link"}
            </button>
          ) : null}
          {ids.length ? (
            <button type="button" onClick={clear} className="text-sm text-bas-muted">
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {ids.length === 0 ? (
        <p className="mt-10 text-sm text-bas-muted">
          Nothing selected.{" "}
          <Link href={BRIEF_COMPARE_HREF} className="text-bas-primary">
            Compare the four BAS sellers
          </Link>{" "}
          or open the{" "}
          <Link href="/market" className="text-bas-primary">
            market
          </Link>{" "}
          and tap Compare.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
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
                      {canActivate(a) ? (
                        <Button href={hirePath(a.chainId, a.tokenId)}>{hireCta(a)}</Button>
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
    </div>
  );
}

function rows(agents: MarketplaceAgent[]) {
  return [
    { k: "Category", vs: agents.map((a) => categoryLabel(a.category)) },
    { k: "Source", vs: agents.map((a) => (a.source === "8004scan" ? "8004scan" : "BAS seller")) },
    {
      k: "ERC-8004 score",
      vs: agents.map((a) => (a.totalScore ? a.totalScore.toFixed(1) : "—")),
      mono: true,
    },
    {
      k: "Feedback",
      vs: agents.map((a) => (a.feedbackCount ? String(a.feedbackCount) : "—")),
      mono: true,
    },
    {
      k: "Win rate (published)",
      vs: agents.map((a) =>
        a.metrics.winRate != null ? `${a.metrics.winRate.toFixed(1)}%` : "—",
      ),
      mono: true,
    },
    { k: "PnL (published)", vs: agents.map((a) => formatPct(a.metrics.pnlPct)), mono: true },
    {
      k: "Max DD (published)",
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
    { k: "Hireable", vs: agents.map((a) => (canActivate(a) ? "Yes" : "No")) },
  ];
}
