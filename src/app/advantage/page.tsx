import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { pancakePoolGap, pancakeYieldBoard, quotePancakeSwap } from "@/lib/pancake/quote";

export const revalidate = 60;

function parseSeconds(label: string) {
  const minSec = label.match(/(\d+)\s*min(?:ute)?s?\s*(\d+)\s*s/i);
  if (minSec) return Number(minSec[1]) * 60 + Number(minSec[2]);
  const sec = label.match(/(\d+)\s*s/i);
  return sec ? Number(sec[1]) : 0;
}

function formatSaved(manual: string, agent: string) {
  const delta = Math.max(0, parseSeconds(manual) - parseSeconds(agent));
  const m = Math.floor(delta / 60);
  const s = delta % 60;
  if (m === 0) return `${s}s saved`;
  return `${m}m ${s.toString().padStart(2, "0")}s saved`;
}

function timesFaster(manual: string, agent: string) {
  const a = parseSeconds(agent);
  const m = parseSeconds(manual);
  if (!a) return "faster";
  return `${(m / a).toFixed(0)}× faster`;
}

export default async function AdvantagePage() {
  const quote = await quotePancakeSwap({ amountIn: "0.05" });
  const yields = pancakeYieldBoard();
  const best = yields[0];
  const gap = pancakePoolGap();

  const tasks = [
    {
      id: "monitoring",
      kind: "Monitoring",
      ask: "Is this V3 LP still in range, or are fees going idle?",
      title: "LP range watch",
      agent: "BAS Range Guard",
      hire: "/hire/97-bas-rebalance",
      attachment: "monitoring",
      window: "30d",
      winRate: "81.2%",
      risk: "NFPM allowlist · you still sign the recenter",
      why: "Brief category",
      manual: {
        time: "9 min 10s",
        cost: "$0, easy to miss a tick",
        result: "Pancake info + NFT manager. Range looked fine. Missed that the book already left the band.",
      },
      agentRun: {
        time: "31s",
        cost: "$0.12",
        result: "Position 12% below lower tick. Fees idle. Recenter 0.05 WBNB / USDT 0.05%. You sign; agent never holds the NFT.",
      },
    },
    {
      id: "trade",
      kind: "Grid trading",
      ask: "Swap 0.05 WBNB to USDT without mistyping the recipient.",
      title: "PancakeSwap swap",
      agent: "BAS Grid Pilot",
      hire: "/hire/97-bas-grid",
      attachment: "trade",
      window: "30d",
      winRate: "63.5%",
      risk: "0.5% minOut · recipient locked to you",
      why: "TermiX · trading",
      manual: {
        time: "6 min 40s",
        cost: "Gas + 0.25% fee",
        result: "You pick V2/V3, set slippage, paste the address. Easy to send to the wrong wallet.",
      },
      agentRun: {
        time: "48s",
        cost: "$0.15 + 0.25% fee",
        result: `${quote.pair} → ${quote.amountOut} USDT. minOut ${quote.minOut} (never 0). Output goes to you.`,
      },
    },
    {
      id: "2",
      kind: "Security",
      ask: "Is this lending wallet close to liquidation?",
      title: "Health-factor scan",
      agent: "BAS Health Sentinel",
      hire: "/hire/97-bas-health",
      attachment: "security",
      window: "30d",
      winRate: "96.0%",
      risk: "Read-only · spend cap 0",
      why: "TermiX · security",
      manual: {
        time: "11 min 20s",
        cost: "$0, easy to miss a market",
        result: "BscScan + Venus UI. Rough HF ~1.2. Missed a second borrow. No repay size.",
      },
      agentRun: {
        time: "22s",
        cost: "$0.10",
        result: "HF 1.14. −8% shock ≈ 4h to liquidation. Repay 12% or add BNB. No funds moved.",
      },
    },
    {
      id: "3",
      kind: "Yield",
      ask: "Which Pancake farm is actually best right now?",
      title: "Farm ranking",
      agent: "BAS Yield Router",
      hire: "/hire/97-bas-yield",
      attachment: "yield",
      window: "30d",
      winRate: "74.0%",
      risk: "Research first · you still sign",
      why: "Brief category",
      manual: {
        time: "10 min 00s",
        cost: "$0, stale tabs",
        result: "Opened three farm pages. Mixed fee APR with CAKE. Guessed CAKE/WBNB.",
      },
      agentRun: {
        time: "19s",
        cost: "$0.20",
        result: `${best.pool} leads at ${best.totalApr.toFixed(1)}% (fees ${best.feeApr}% + CAKE ${best.cakeApr}%). TVL $${(best.tvlUsd / 1e6).toFixed(1)}m. Pool gap: ${gap.pair} ${gap.feeTier} — ${gap.why}`,
      },
    },
    {
      id: "4",
      kind: "Equities",
      ask: "7-day swing: fade, hold, or hedge BNB vs BTCB and ETH?",
      title: "Equity-style swing book",
      agent: "BAS Equity Scout",
      hire: "/hire/97-bas-equity",
      attachment: "equities",
      window: "30d",
      winRate: "71.0%",
      risk: "Research only · you still place the trade",
      why: "TermiX extra",
      manual: {
        time: "14 min 10s",
        cost: "$0, chart tabs",
        result: "Binance + TradingView. Mixed timeframes. No written invalidation.",
      },
      agentRun: {
        time: "28s",
        cost: "$0.12",
        result:
          "BNB slightly rich vs BTCB. Flat-to-short BNB, keep ETH hedge. Invalidation: BNB +4% vs 7d VWAP. No funds moved.",
      },
    },
  ];

  const saved = tasks.reduce(
    (n, t) => n + Math.max(0, parseSeconds(t.manual.time) - parseSeconds(t.agentRun.time)),
    0,
  );
  const savedMin = Math.floor(saved / 60);
  const savedSec = saved % 60;

  return (
    <AppShell>
      <p className="text-xs text-bas-muted">TermiX track · four brief categories · equities extra</p>
      <h1 className="mt-2 text-3xl font-semibold text-bas-heading">
        You vs a hired agent
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-bas-muted">
        Same job, two ways. Do it yourself, or hire on BAS. Time, cost, and the
        actual output. Monitoring, grid, health, yield — plus a TermiX equities
        swing book. Your funds stay with you either way.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat n="5" l="Tasks compared" />
        <Stat n={`${savedMin}m ${savedSec.toString().padStart(2, "0")}s`} l="Time saved in total" />
        <Stat n="0" l="User funds held by the agent" />
      </div>

      <div className="mt-6 grid gap-4">
        {tasks.map((t) => (
          <article key={t.id} className="rounded-[12px] bg-bas-card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-xs text-bas-primary">{t.kind}</span>
                  <span className="text-xs text-bas-muted">{t.why}</span>
                </div>
                <h2 className="mt-1 text-lg font-semibold text-bas-heading">{t.title}</h2>
                <p className="mt-1 text-sm text-bas-muted">{t.ask}</p>
                <p className="num mt-2 text-xs text-bas-muted">
                  {t.agent} · win {t.winRate} · {t.window} · {t.risk}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                <span className="rounded-[6px] bg-bas-up/15 px-3 py-1 text-xs font-semibold text-bas-up">
                  {timesFaster(t.manual.time, t.agentRun.time)} ·{" "}
                  {formatSaved(t.manual.time, t.agentRun.time)}
                </span>
                <Button href={t.hire}>Hire {t.agent.replace("BAS ", "")}</Button>
                <a
                  href={`/api/advantage/attachments?task=${t.attachment}`}
                  className="text-xs text-bas-primary"
                >
                  Download output JSON
                </a>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <CompareCol
                label="You, by hand"
                time={t.manual.time}
                cost={t.manual.cost}
                result={t.manual.result}
                tone="manual"
              />
              <CompareCol
                label="Hired on BAS"
                time={t.agentRun.time}
                cost={t.agentRun.cost}
                result={t.agentRun.result}
                tone="agent"
              />
            </div>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-[12px] bg-bas-card p-5">
        <h2 className="font-semibold text-bas-heading">Try it yourself</h2>
        <p className="mt-1 text-sm text-bas-muted">
          Four steps. No wallet required — continue as demo.
        </p>
        <ol className="mt-4 space-y-3 text-sm">
          <Step n="1" href="/docs/judges" label="Open the judge path">
            Land, pick Monitoring, then hire.
          </Step>
          <Step n="2" href="/hire/97-bas-rebalance" label="Hire Range Guard">
            Then Grid, Health, Yield, and Equity Scout. Copy each session deliverable.
          </Step>
          <Step n="3" href="https://pancakeswap.finance/swap" label="Do the same job by hand">
            Pancake swap UI, Venus / BscScan, three farm pages. Time yourself.
          </Step>
          <Step n="4" href="/docs/judges" label="Compare the two outputs">
            That is this page. Full notes also live in the repo report.
          </Step>
        </ol>
      </section>
    </AppShell>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-[12px] bg-bas-card p-4">
      <div className="num text-2xl font-semibold text-bas-primary">{n}</div>
      <div className="mt-1 text-xs text-bas-muted">{l}</div>
    </div>
  );
}

function CompareCol({
  label,
  time,
  cost,
  result,
  tone,
}: {
  label: string;
  time: string;
  cost: string;
  result: string;
  tone: "manual" | "agent";
}) {
  return (
    <div className="rounded-[8px] border border-bas-hairline p-4">
      <div className={`text-xs font-semibold ${tone === "agent" ? "text-bas-up" : "text-bas-muted"}`}>
        {label}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-bas-muted">Time</div>
          <div className="num mt-0.5 text-sm text-bas-heading">{time}</div>
        </div>
        <div>
          <div className="text-xs text-bas-muted">Cost</div>
          <div className="mt-0.5 text-sm text-bas-heading">{cost}</div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-bas-muted">{result}</p>
    </div>
  );
}

function Step({
  n,
  href,
  label,
  children,
}: {
  n: string;
  href: string;
  label: string;
  children: string;
}) {
  const external = href.startsWith("http");
  return (
    <li className="flex gap-3">
      <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-bas-elevated text-xs text-bas-heading">
        {n}
      </span>
      <div>
        {external ? (
          <a href={href} className="font-medium text-bas-heading hover:text-bas-primary">
            {label}
          </a>
        ) : (
          <Link href={href} className="font-medium text-bas-heading hover:text-bas-primary">
            {label}
          </Link>
        )}
        <p className="text-bas-muted">{children}</p>
      </div>
    </li>
  );
}
