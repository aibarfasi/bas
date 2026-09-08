import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { CategoryBadge, FeaturedBadge, LiveBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { CompareToggle } from "@/components/agent/CompareToggle";
import { getScanAgent } from "@/lib/agents/scan";
import { probeEndpoint } from "@/lib/agents/liveness";
import { CATEGORY_META } from "@/lib/categories";
import {
  altanaExplorer,
  chainName,
  explorerAddress,
  formatPct,
  formatUsd,
  hirePath,
  scanAgent,
  shortAddr,
  timeAgo,
} from "@/lib/format";

export const revalidate = 60;

export default async function AgentPage({
  params,
}: {
  params: Promise<{ chainId: string; tokenId: string }>;
}) {
  const { chainId, tokenId } = await params;
  const agent = await getScanAgent(Number(chainId), tokenId);
  if (!agent) notFound();

  const endpoint = agent.services.find((s) => s.endpoint)?.endpoint;
  if (endpoint) {
    const live = await probeEndpoint(endpoint);
    agent.live = live.live;
    agent.liveReason = live.reason;
  }

  const cat =
    agent.category !== "uncategorized" ? CATEGORY_META[agent.category] : null;

  return (
    <AppShell>
      <div className="flex flex-col gap-2 text-xs text-bas-muted md:flex-row md:items-center">
        <Link href="/market">Market</Link>
        <span className="hidden md:inline">/</span>
        <span className="text-bas-body">{agent.name}</span>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {agent.featured ? <FeaturedBadge /> : null}
            <CategoryBadge cat={agent.category} />
            <LiveBadge live={agent.live} />
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-bas-heading">{agent.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-bas-muted">
            {agent.description || agent.categoryReason}
          </p>
          <p className="mt-2 text-xs text-bas-muted">{agent.liveReason}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <CompareToggle id={agent.id} />
          {agent.hireable ? (
            <Button href={hirePath(agent.chainId, agent.tokenId)} className="h-10">
              Hire
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Not hireable
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 rounded-[12px] bg-bas-card p-5 md:grid-cols-4 lg:grid-cols-6">
        <Metric label="Score" value={agent.totalScore ? agent.totalScore.toFixed(1) : "—"} />
        <Metric label="Avg feedback" value={agent.averageScore ? String(agent.averageScore) : "—"} />
        <Metric
          label="Win rate"
          value={agent.metrics.winRate != null ? `${agent.metrics.winRate.toFixed(1)}%` : "—"}
        />
        <Metric
          label="PnL"
          value={formatPct(agent.metrics.pnlPct)}
          tone={
            (agent.metrics.pnlPct ?? 0) > 0
              ? "up"
              : (agent.metrics.pnlPct ?? 0) < 0
                ? "down"
                : "muted"
          }
        />
        <Metric
          label="Max DD"
          value={
            agent.metrics.maxDrawdown != null
              ? `${agent.metrics.maxDrawdown.toFixed(1)}%`
              : "—"
          }
          tone="down"
        />
        <Metric label="Price" value={formatUsd(agent.priceUsd)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-[12px] bg-bas-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-bas-heading">What it does</h2>
          <p className="mt-2 text-sm leading-6 text-bas-muted">
            {cat ? cat.job : agent.categoryReason}
          </p>
          {cat ? (
            <p className="mt-3 text-sm text-bas-body">{cat.pancake}</p>
          ) : (
            <p className="mt-3 text-sm text-bas-muted">
              Shown as uncategorized on purpose. We do not drop records that fail the
              four-category map.
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            <Metric label="Window" value={agent.metrics.window ?? "—"} />
            <Metric
              label="Fills"
              value={agent.metrics.fills != null ? String(agent.metrics.fills) : "—"}
            />
            <Metric label="Venue" value={agent.metrics.venue ?? "—"} />
            <Metric label="Risk" value={agent.metrics.risk ?? "—"} />
            <Metric label="x402" value={agent.x402 ? "Yes" : "No"} />
            <Metric
              label="Protocols"
              value={agent.protocols.length ? agent.protocols.join(" · ") : "—"}
            />
          </div>
        </section>

        <section className="rounded-[12px] bg-bas-card p-5">
          <h2 className="text-sm font-semibold text-bas-heading">Onchain identity</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Chain" v={chainName(agent.chainId)} />
            <Row k="Token" v={agent.tokenId} mono />
            <Row k="Owner" v={shortAddr(agent.owner)} href={explorerAddress(agent.chainId, agent.owner)} />
            <Row
              k="Agent wallet"
              v={shortAddr(agent.agentWallet)}
              href={
                agent.agentWallet
                  ? explorerAddress(agent.chainId, agent.agentWallet)
                  : undefined
              }
            />
            <Row
              k="8004scan"
              v="Open record"
              href={scanAgent(agent.chainId, agent.tokenId)}
            />
            <Row k="Registered" v={timeAgo(agent.createdAt)} />
          </dl>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[12px] bg-bas-card p-5">
          <h2 className="text-sm font-semibold text-bas-heading">Altana policy preview</h2>
          {agent.policy ? (
            <dl className="mt-3 space-y-2 text-sm">
              <Row
                k="Session wallet"
                v={shortAddr(agent.policy.wallet)}
                href={altanaExplorer(agent.policy.wallet)}
              />
              <Row
                k="Spend cap"
                v={`${agent.policy.spendCap} ${agent.policy.spendToken} / session`}
              />
              <Row k="Expiry" v={`${agent.policy.expiryHours}h`} />
              <Row
                k="Allowlist"
                v={
                  agent.policy.allowlist.length
                    ? agent.policy.allowlist.map((a) => a.label).join(" · ")
                    : "Read-only. No spend."
                }
              />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-bas-muted">
              No Altana session policy on this record. Hire is disabled until the
              agent publishes allowlist, cap, and expiry.
            </p>
          )}
        </section>

        <section className="rounded-[12px] bg-bas-card p-5">
          <h2 className="text-sm font-semibold text-bas-heading">
            Feedback ({agent.feedbackCount})
          </h2>
          {agent.feedback.length ? (
            <ul className="mt-3 space-y-3">
              {agent.feedback.map((f) => (
                <li key={f.at} className="border-b border-bas-hairline pb-3 last:border-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="num text-bas-primary">{f.score}</span>
                    <span className="text-bas-muted">{f.tag} · {timeAgo(f.at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-bas-body">{f.comment}</p>
                  <p className="num mt-1 text-xs text-bas-muted">{f.client}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-bas-muted">
              No feedback indexed yet. Score {agent.averageScore || 0} from{" "}
              {agent.feedbackCount} on-chain signals.
            </p>
          )}
        </section>
      </div>

      {agent.hireable ? (
        <div className="sticky bottom-0 -mx-4 mt-8 border-t border-bas-hairline bg-bas-canvas px-4 py-3 md:hidden">
          <Button href={hirePath(agent.chainId, agent.tokenId)} className="w-full">
            Hire
          </Button>
        </div>
      ) : null}
    </AppShell>
  );
}

function Row({
  k,
  v,
  href,
  mono,
}: {
  k: string;
  v: string;
  href?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-bas-muted">{k}</dt>
      <dd className={mono ? "num truncate text-bas-body" : "truncate text-bas-body"}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-bas-primary">
            {v}
          </a>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}
