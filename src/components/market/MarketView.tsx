"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryBadge, FeaturedBadge, LiveBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FILTERS, catQuery } from "@/lib/categories";
import { useCompareStore } from "@/lib/compare/store";
import type { AgentsResponse, CategoryFilter, MarketplaceAgent } from "@/lib/agents/types";
import { agentPath, formatPct, formatUsd, hirePath, shortAddr } from "@/lib/format";

function pnlTone(n: number | null) {
  if (n == null) return "muted" as const;
  if (n > 0) return "up" as const;
  if (n < 0) return "down" as const;
  return "muted" as const;
}

export function MarketView({
  data,
  initialCat = "all",
}: {
  data: AgentsResponse;
  initialCat?: CategoryFilter;
}) {
  const router = useRouter();
  const [cat, setCat] = useState<CategoryFilter>(initialCat);
  const [q, setQ] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);
  const [showUncat, setShowUncat] = useState(true);
  const compare = useCompareStore();

  const filtered = useMemo(() => {
    return data.agents.filter((a) => {
      if (cat !== "all" && a.category !== cat) return false;
      if (!showUncat && a.category === "uncategorized") return false;
      if (liveOnly && a.live !== true) return false;
      if (q) {
        const hay = `${a.name} ${a.description} ${a.tokenId} ${a.owner}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [data.agents, cat, q, liveOnly, showUncat]);

  const uncatCount = data.agents.filter((a) => a.category === "uncategorized").length;

  function setCategory(next: CategoryFilter) {
    setCat(next);
    const q = catQuery(next);
    const url = q ? `/market?cat=${q}` : "/market";
    router.replace(url, { scroll: false });
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-bas-hairline pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-bas-heading">Market</h1>
          <p className="mt-1 text-sm text-bas-muted">
            <span className="num text-bas-primary">{data.stats.totalOnBsc.toLocaleString()}</span>{" "}
            agents indexed on 8004scan. Showing {data.stats.scanned} with{" "}
            {data.stats.featured} hire-ready BAS sellers. Uncategorized agents stay visible.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-bas-muted">
          <span className="num">{data.stats.live} live</span>
          <span className="num">{uncatCount} uncategorized</span>
        </div>
      </div>

      <div className="sticky top-16 z-20 -mx-4 mt-4 border-y border-bas-hairline bg-bas-canvas/80 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCategory(f.id)}
              className={`h-10 shrink-0 rounded-[6px] px-3 text-sm ${
                cat === f.id
                  ? "bg-bas-primary text-bas-on-primary"
                  : "bg-bas-card text-bas-body hover:bg-bas-elevated"
              }`}
            >
              {f.label}
            </button>
          ))}
          <label className="relative min-w-[160px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bas-muted">
              <SearchIcon />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, token, or owner"
              className="h-10 w-full rounded-[8px] border border-bas-hairline bg-bas-card pl-10 pr-10 text-sm text-bas-heading outline-none placeholder:text-bas-muted focus:border-bas-primary"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-[6px] text-xs text-bas-muted hover:bg-bas-elevated hover:text-bas-heading"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : null}
          </label>
          <button
            type="button"
            onClick={() => setLiveOnly((v) => !v)}
            aria-pressed={liveOnly}
            className={`h-10 shrink-0 rounded-[6px] border px-3 text-sm ${
              liveOnly
                ? "border-bas-up/40 bg-bas-up/15 text-bas-up"
                : "border-bas-hairline bg-bas-card text-bas-muted hover:text-bas-heading"
            }`}
          >
            Live
          </button>
          <button
            type="button"
            onClick={() => setShowUncat((v) => !v)}
            aria-pressed={showUncat}
            className={`h-10 shrink-0 rounded-[6px] border px-3 text-sm ${
              showUncat
                ? "border-bas-primary/40 bg-bas-primary/15 text-bas-heading"
                : "border-bas-hairline bg-bas-card text-bas-muted hover:text-bas-heading"
            }`}
          >
            Uncat
          </button>
          <span className="num shrink-0 text-xs text-bas-muted">
            {filtered.length}/{data.stats.scanned}
          </span>
        </div>
      </div>

      <div className="mt-4 hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-bas-muted">
            <tr className="border-b border-bas-hairline">
              <th className="py-3 font-medium">Agent</th>
              <th className="py-3 font-medium">Category</th>
              <th className="py-3 font-medium">Live</th>
              <th className="py-3 font-medium">Score</th>
              <th className="py-3 font-medium">Win / PnL</th>
              <th className="py-3 font-medium">Risk</th>
              <th className="py-3 font-medium">Price</th>
              <th className="py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                className="border-b border-bas-hairline/70 hover:bg-bas-card/60"
              >
                <td className="py-3 pr-3">
                  <Link href={agentPath(a.chainId, a.tokenId)} className="block">
                    <div className="flex items-center gap-2">
                      {a.featured ? <FeaturedBadge /> : null}
                      <span className="font-medium text-bas-heading">{a.name}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-bas-muted">
                      {a.chainId}:{shortAddr(a.tokenId, 6)} · {shortAddr(a.owner)}
                    </div>
                  </Link>
                </td>
                <td className="py-3">
                  <CategoryBadge cat={a.category} />
                </td>
                <td className="py-3">
                  <LiveBadge live={a.live} />
                </td>
                <td className="num py-3">{a.totalScore ? a.totalScore.toFixed(1) : "—"}</td>
                <td className="py-3">
                  <span className={`num ${a.metrics.winRate != null ? "text-bas-body" : "text-bas-muted"}`}>
                    {a.metrics.winRate != null ? `${a.metrics.winRate.toFixed(1)}%` : "—"}
                  </span>
                  <span className={`num ml-2 text-${pnlTone(a.metrics.pnlPct) === "up" ? "bas-up" : pnlTone(a.metrics.pnlPct) === "down" ? "bas-down" : "bas-muted"}`}>
                    {formatPct(a.metrics.pnlPct)}
                  </span>
                </td>
                <td className="max-w-[180px] truncate py-3 text-xs text-bas-muted">
                  {a.metrics.risk ?? a.categoryReason}
                </td>
                <td className="num py-3">{formatUsd(a.priceUsd)}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => compare.toggle(a.id)}
                      className={`h-10 rounded-[6px] px-3 text-xs ${
                        compare.has(a.id)
                          ? "bg-bas-primary text-bas-on-primary"
                          : "bg-bas-card"
                      }`}
                    >
                      {compare.has(a.id) ? "Added" : "Compare"}
                    </button>
                    {a.hireable ? (
                      <Button href={hirePath(a.chainId, a.tokenId)} className="h-10 px-4">
                        Hire
                      </Button>
                    ) : (
                      <Button href={agentPath(a.chainId, a.tokenId)} variant="secondary" className="h-10 px-4">
                        View
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {filtered.map((a) => (
          <AgentMobileCard key={a.id} agent={a} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-bas-muted">
          No agents match. Uncheck filters or open Uncategorized — we do not hide weak records.
        </p>
      ) : null}

      {compare.ids.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bas-hairline bg-bas-card px-4 py-3 md:px-6">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <div className="text-sm">
              <span className="num text-bas-primary">{compare.ids.length}</span> selected
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => compare.clear()}>
                Clear
              </Button>
              <Button href="/compare">Compare</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.4 10.4 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AgentMobileCard({ agent: a }: { agent: MarketplaceAgent }) {
  const compare = useCompareStore();
  return (
    <div className="rounded-[12px] bg-bas-card p-4">
      <div className="flex items-start justify-between gap-2">
        <Link href={agentPath(a.chainId, a.tokenId)}>
          <div className="flex items-center gap-2">
            {a.featured ? <FeaturedBadge /> : null}
            <span className="font-medium text-bas-heading">{a.name}</span>
          </div>
        </Link>
        <LiveBadge live={a.live} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <CategoryBadge cat={a.category} />
        <span className="num text-xs text-bas-muted">
          {a.totalScore ? a.totalScore.toFixed(1) : "—"} score
        </span>
        <span className="num text-xs text-bas-muted">{formatUsd(a.priceUsd)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-bas-muted">
        {a.description || a.categoryReason}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-bas-muted">Win</div>
          <div className="num">{a.metrics.winRate != null ? `${a.metrics.winRate.toFixed(1)}%` : "—"}</div>
        </div>
        <div>
          <div className="text-bas-muted">PnL</div>
          <div className={`num text-bas-${pnlTone(a.metrics.pnlPct) === "up" ? "up" : pnlTone(a.metrics.pnlPct) === "down" ? "down" : "muted"}`}>
            {formatPct(a.metrics.pnlPct)}
          </div>
        </div>
        <div>
          <div className="text-bas-muted">Venue</div>
          <div className="truncate">{a.metrics.venue ?? "—"}</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => compare.toggle(a.id)}
          className="h-10 flex-1 rounded-[6px] bg-bas-elevated text-sm"
        >
          {compare.has(a.id) ? "Added" : "Compare"}
        </button>
        <Button
          href={a.hireable ? hirePath(a.chainId, a.tokenId) : agentPath(a.chainId, a.tokenId)}
          className="flex-1"
        >
          {a.hireable ? "Hire" : "View"}
        </Button>
      </div>
    </div>
  );
}

