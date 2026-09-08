import Link from "next/link";
import { CategoryBadge, LiveBadge } from "@/components/ui/Badge";
import type { MarketplaceAgent } from "@/lib/agents/types";
import { agentStory, categoryLabel } from "@/lib/categories";
import { agentPath, canActivate, formatPct, formatUsd, hirePath } from "@/lib/format";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

function pnlClass(n: number | null) {
  if (n == null) return "text-bas-heading";
  if (n > 0) return "text-bas-up";
  if (n < 0) return "text-bas-down";
  return "text-bas-heading";
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-bas-muted">{label}</div>
      <div className={`num mt-0.5 truncate text-sm font-medium ${tone ?? "text-bas-heading"}`}>{value}</div>
    </div>
  );
}

function Card({ agent }: { agent: MarketplaceAgent }) {
  const href = canActivate(agent) ? hirePath(agent.chainId, agent.tokenId) : agentPath(agent.chainId, agent.tokenId);
  const { job } = agentStory(agent);
  const m = agent.metrics;
  const hire = canActivate(agent);

  return (
    <Link
      href={href}
      className="bas-glass flex min-h-0 flex-col rounded-[12px] p-4 backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="flex items-start gap-3">
        {agent.imageUrl ? (
          <img src={agent.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-[8px] object-cover" />
        ) : (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-bas-elevated text-xs font-semibold text-bas-heading">
            {initials(agent.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge cat={agent.category} />
            <LiveBadge live={agent.live} />
            {agent.x402 ? <span className="text-[11px] text-bas-muted">x402</span> : null}
          </div>
          <div className="mt-1 truncate font-semibold text-bas-heading">{agent.name}</div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-5 text-bas-muted">
        {job || agent.description || categoryLabel(agent.category)}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-bas-hairline pt-3">
        <Stat
          label={m.window ?? "Win"}
          value={m.winRate != null ? `${m.winRate.toFixed(1)}%` : "—"}
        />
        <Stat label="PnL" value={formatPct(m.pnlPct)} tone={pnlClass(m.pnlPct)} />
        <Stat label="Score" value={agent.totalScore ? agent.totalScore.toFixed(1) : "—"} />
        <Stat label="Price" value={formatUsd(agent.priceUsd)} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div className="min-w-0">
          <div className="truncate text-[11px] text-bas-muted">{m.venue || m.risk || "ERC-8004"}</div>
          {m.fills != null ? (
            <div className="num mt-0.5 text-[11px] text-bas-muted">{m.fills} fills</div>
          ) : agent.feedbackCount ? (
            <div className="num mt-0.5 text-[11px] text-bas-muted">{agent.feedbackCount} reviews</div>
          ) : null}
        </div>
        <span className="shrink-0 text-xs font-semibold text-bas-primary">{hire ? "Hire" : "View"} →</span>
      </div>
    </Link>
  );
}

export function TrendingBento({ agents }: { agents: MarketplaceAgent[] }) {
  if (!agents.length) return null;

  return (
    <aside>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-xs text-bas-muted">Trending</p>
        <Link href="/market" className="text-xs text-bas-primary">
          Market →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {agents.map((a) => (
          <Card key={a.id} agent={a} />
        ))}
      </div>
    </aside>
  );
}
