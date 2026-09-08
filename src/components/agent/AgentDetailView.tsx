"use client";

import Link from "next/link";
import { CompareToggle } from "@/components/agent/CompareToggle";
import { CategoryBadge, FeaturedBadge, LiveBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import type { MarketplaceAgent } from "@/lib/agents/types";
import { agentStory, categoryHirePath } from "@/lib/categories";
import {
  altanaExplorer,
  chainName,
  explorerAddress,
  formatPct,
  formatUsd,
  hirePath,
  publishedX402,
  scanAgent,
  shortAddr,
  timeAgo,
} from "@/lib/format";

type Props = {
  agent: MarketplaceAgent;
  compact?: boolean;
};

export function AgentDetailView({ agent, compact = false }: Props) {
  const { job, pancake } = agentStory(agent);
  const stats = publicStats(agent);
  const extras = publicExtras(agent);

  return (
    <div>
      {!compact ? (
        <div className="flex flex-col gap-2 text-xs text-bas-muted md:flex-row md:items-center">
          <Link href="/market">Market</Link>
          <span className="hidden md:inline">/</span>
          <span className="text-bas-body">{agent.name}</span>
        </div>
      ) : null}

      <div className={`${compact ? "" : "mt-4"} flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {agent.featured ? <FeaturedBadge /> : null}
            <CategoryBadge cat={agent.category} />
            <LiveBadge live={agent.live} />
            {agent.verified ? (
              <span className="rounded-[4px] bg-bas-elevated px-2 py-0.5 text-xs text-bas-body">
                Verified
              </span>
            ) : null}
          </div>
          <h1 className={`mt-3 font-semibold text-bas-heading ${compact ? "text-xl" : "text-3xl"}`}>
            {agent.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-bas-muted">
            {agent.description || job}
          </p>
          {agent.liveReason ? (
            <p className="mt-2 text-xs text-bas-muted">{agent.liveReason}</p>
          ) : null}
        </div>
        {!compact ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <CompareToggle id={agent.id} />
            {agent.hireable ? (
              <Button href={hirePath(agent.chainId, agent.tokenId)} className="h-10">
                Hire {formatUsd(agent.priceUsd)}
              </Button>
            ) : publishedX402(agent) ? (
              <Button href={hirePath(agent.chainId, agent.tokenId)} className="h-10">
                Try x402
              </Button>
            ) : (
              <Button href={categoryHirePath(agent.category)} className="h-10">
                Hire BAS seller
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {stats.length ? (
        <div
          className={`mt-6 grid gap-4 rounded-[12px] bg-bas-card p-5 ${
            stats.length >= 5 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-4"
          }`}
        >
          {stats.map((s) => (
            <Metric key={s.label} label={s.label} value={s.value} tone={s.tone} />
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-[12px] bg-bas-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-bas-heading">What it does</h2>
          {job ? (
            <p className="mt-2 text-sm leading-6 text-bas-muted">{job}</p>
          ) : (
            <p className="mt-2 text-sm text-bas-muted">Operator has not published a job description yet.</p>
          )}
          {pancake ? <p className="mt-3 text-sm text-bas-body">{pancake}</p> : null}
          {extras.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {extras.map((s) => (
                <Metric key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          ) : null}
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
              href={agent.agentWallet ? explorerAddress(agent.chainId, agent.agentWallet) : undefined}
            />
            <Row k="8004scan" v="Open record" href={scanAgent(agent.chainId, agent.tokenId)} />
            <Row k="Registered" v={timeAgo(agent.createdAt)} />
          </dl>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[12px] bg-bas-card p-5">
          <h2 className="text-sm font-semibold text-bas-heading">How to hire</h2>
          {agent.hireable && agent.policy ? (
            <>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-bas-muted">
                <li>Review the job, cap, and allowlist on this page.</li>
                <li>
                  Pay {formatUsd(agent.priceUsd)}
                  {agent.x402 ? " over x402" : ""}. Output stays in your wallet.
                </li>
                <li>
                  Altana opens a session for {agent.policy.expiryHours}h with a{" "}
                  {agent.policy.spendCap} {agent.policy.spendToken} cap.
                </li>
                <li>Revoke the grant anytime from the session page.</li>
              </ol>
              <dl className="mt-4 space-y-2 text-sm">
                <Row
                  k="Session wallet"
                  v={shortAddr(agent.policy.wallet)}
                  href={altanaExplorer(agent.policy.wallet)}
                />
                <Row k="Spend cap" v={`${agent.policy.spendCap} ${agent.policy.spendToken} / session`} />
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
            </>
          ) : publishedX402(agent) ? (
            <div className="mt-3 text-sm leading-6 text-bas-muted">
              <p>
                This 8004scan record publishes an x402 face. BAS will call that
                endpoint and show the real 402 or failure — we do not run our
                seller under their name.
              </p>
              <Button href={hirePath(agent.chainId, agent.tokenId)} className="mt-3">
                Try published x402
              </Button>
              <p className="mt-3">
                For a guaranteed hire, use the BAS seller in this category.
              </p>
              <Button href={categoryHirePath(agent.category)} variant="secondary" className="mt-2">
                Hire BAS seller
              </Button>
            </div>
          ) : (
            <div className="mt-3 text-sm leading-6 text-bas-muted">
              <p>
                This 8004scan record has no payable face. Hire a live BAS seller
                in the same category — same template, end to end.
              </p>
              <Button href={categoryHirePath(agent.category)} className="mt-3">
                Hire BAS seller
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-[12px] bg-bas-card p-5">
          <h2 className="text-sm font-semibold text-bas-heading">
            Feedback ({agent.feedbackCount || agent.feedback.length})
          </h2>
          {agent.feedback.length ? (
            <ul className="mt-3 space-y-3">
              {agent.feedback.map((f, i) => (
                <li key={`${f.at}-${i}`} className="border-b border-bas-hairline pb-3 last:border-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="num text-bas-primary">{f.score}</span>
                    <span className="text-bas-muted">
                      {f.tag} · {timeAgo(f.at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-bas-body">{f.comment}</p>
                  <p className="num mt-1 text-xs text-bas-muted">{f.client}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-bas-muted">
              No operator-published feedback yet.
              {agent.averageScore
                ? ` Indexed score ${agent.averageScore} from ${agent.feedbackCount} signals.`
                : ""}
            </p>
          )}
        </section>
      </div>

      {!compact && (agent.hireable || publishedX402(agent)) ? (
        <div className="sticky bottom-0 -mx-4 mt-8 border-t border-bas-hairline bg-bas-canvas px-4 py-3 md:hidden">
          <Button href={hirePath(agent.chainId, agent.tokenId)} className="w-full">
            {agent.hireable ? `Hire ${formatUsd(agent.priceUsd)}` : "Try x402"}
          </Button>
        </div>
      ) : !compact ? (
        <div className="sticky bottom-0 -mx-4 mt-8 border-t border-bas-hairline bg-bas-canvas px-4 py-3 md:hidden">
          <Button href={categoryHirePath(agent.category)} className="w-full">
            Hire BAS seller
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function publicStats(agent: MarketplaceAgent) {
  const pnl = agent.metrics.pnlPct;
  const items: { label: string; value: string; tone?: "up" | "down" | "muted" | "default" }[] = [];
  if (agent.totalScore) items.push({ label: "Score", value: agent.totalScore.toFixed(1) });
  if (agent.averageScore) items.push({ label: "Avg feedback", value: String(agent.averageScore) });
  if (agent.feedbackCount) {
    items.push({ label: "Feedback", value: String(agent.feedbackCount) });
  }
  if (agent.healthScore != null) items.push({ label: "Health", value: String(agent.healthScore) });
  if (agent.metrics.winRate != null) {
    items.push({ label: "Win rate", value: `${agent.metrics.winRate.toFixed(1)}%` });
  }
  if (pnl != null) {
    items.push({
      label: "PnL",
      value: formatPct(pnl),
      tone: pnl > 0 ? "up" : pnl < 0 ? "down" : "muted",
    });
  }
  if (agent.metrics.maxDrawdown != null) {
    items.push({
      label: "Max DD",
      value: `${agent.metrics.maxDrawdown.toFixed(1)}%`,
      tone: "down",
    });
  }
  if (agent.priceUsd != null) items.push({ label: "Price", value: formatUsd(agent.priceUsd) });
  return items;
}

function publicExtras(agent: MarketplaceAgent) {
  const items: { label: string; value: string }[] = [];
  if (agent.metrics.window) items.push({ label: "Window", value: agent.metrics.window });
  if (agent.metrics.fills != null) items.push({ label: "Fills", value: String(agent.metrics.fills) });
  if (agent.metrics.venue) items.push({ label: "Venue", value: agent.metrics.venue });
  if (agent.metrics.risk) items.push({ label: "Risk", value: agent.metrics.risk });
  items.push({ label: "x402", value: agent.x402 ? "Yes" : "No" });
  if (agent.protocols.length) items.push({ label: "Protocols", value: agent.protocols.join(" · ") });
  return items;
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
