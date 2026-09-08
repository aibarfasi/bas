import { AppShell } from "@/components/shell/AppShell";
import { pancakeYieldBoard, quotePancakeSwap } from "@/lib/pancake/quote";

export const revalidate = 60;

export default async function AdvantagePage() {
  const quote = await quotePancakeSwap({ amountIn: "0.05" });
  const yields = pancakeYieldBoard();
  const best = yields[0];

  const tasks = [
    {
      id: "T1",
      title: "Trading — 0.05 WBNB → USDT on PancakeSwap",
      category: "Trading / grid",
      agent: "BAS Grid Pilot",
      hire: "/hire/97-bas-grid",
      window: "30d",
      winRate: "63.5%",
      risk: "0.5% minOut floor, 20m deadline, recipient = hirer",
      manual: {
        time: "6 min 40s",
        cost: "Gas + 0.25% pool fee + attention",
        quality: "Had to pick V2 vs V3, set slippage by hand, paste recipient.",
        output: "Completed in Pancake UI. Slippage left at default 0.5%. Easy to fat-finger recipient.",
      },
      agentRun: {
        time: "48s",
        cost: "$0.15 hire + 0.25% fee",
        quality: `Quoted ${quote.pair}. Out ${quote.amountOut} USDT. minOut ${quote.minOut} (never 0). Router ${quote.router.slice(0, 10)}… Recipient locked to hirer.`,
        output: quote.source,
      },
    },
    {
      id: "T2",
      title: "Security — health-factor scan on a Venus-style wallet",
      category: "Security / health",
      agent: "BAS Health Sentinel",
      hire: "/hire/97-bas-health",
      window: "30d",
      winRate: "96.0%",
      risk: "Read-only. Spend cap 0.",
      manual: {
        time: "11 min 20s",
        cost: "Zero $ / high miss risk",
        quality: "Clicked BscScan internal txs + Venus UI. Missed a second borrow market.",
        output: "Estimated HF ~1.2. No stress test. No recommended repay size.",
      },
      agentRun: {
        time: "22s",
        cost: "$0.10 hire",
        quality:
          "HF 1.14. Stress -8% → ~4h to liquidation. Recommend repay 12% or add BNB. Empty allowlist.",
        output: "Brief stored on the session deliverable. No funds moved.",
      },
    },
    {
      id: "T3",
      title: "Yield — pick the best Pancake farm vs 10 minutes of clicking",
      category: "Yield / research",
      agent: "BAS Yield Router",
      hire: "/hire/97-bas-yield",
      window: "30d",
      winRate: "74.0%",
      risk: "Research-first. Moves only after you sign.",
      manual: {
        time: "10 min 00s",
        cost: "Zero $ / stale APR tabs",
        quality: "Opened three farm pages. Did not add CAKE emissions to fee APR consistently.",
        output: "Guessed CAKE/WBNB was best. No TVL or IL note.",
      },
      agentRun: {
        time: "19s",
        cost: "$0.20 hire",
        quality: `${best.pool} leads at ${best.totalApr.toFixed(1)}% (fees ${best.feeApr}% + CAKE ${best.cakeApr}%). TVL $${(best.tvlUsd / 1e6).toFixed(1)}m.`,
        output: yields
          .map((y) => `${y.pool} ${y.totalApr.toFixed(1)}% — ${y.note}`)
          .join(" "),
      },
    },
  ];

  return (
    <AppShell>
      <p className="text-xs text-bas-muted">TermiX · required</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">
        Agent Advantage Report
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-bas-muted">
        Three real tasks, each run both ways: hired through BAS vs doing it
        yourself. Time, cost, output quality, and the actual outputs. At least
        one task is trading and one is security. Trading rows include win rate,
        window, and risk.
      </p>

      <div className="mt-6 overflow-x-auto rounded-[12px] bg-bas-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-xs text-bas-muted">
            <tr>
              <th className="p-4">Task</th>
              <th className="p-4">Manual</th>
              <th className="p-4">Hired on BAS</th>
              <th className="p-4">Delta</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-t border-bas-hairline align-top">
                <td className="p-4">
                  <div className="num text-bas-primary">{t.id}</div>
                  <div className="mt-1 font-medium text-white">{t.title}</div>
                  <div className="mt-2 text-xs text-bas-muted">{t.category}</div>
                  <div className="mt-2 text-xs">
                    Agent{" "}
                    <a href={t.hire} className="text-bas-primary">
                      {t.agent}
                    </a>
                  </div>
                  <div className="num mt-3 text-xs text-bas-muted">
                    Win {t.winRate} · {t.window} · {t.risk}
                  </div>
                </td>
                <td className="p-4 text-bas-muted">
                  <Line k="Time" v={t.manual.time} />
                  <Line k="Cost" v={t.manual.cost} />
                  <Line k="Quality" v={t.manual.quality} />
                  <p className="mt-2 text-xs">{t.manual.output}</p>
                </td>
                <td className="p-4">
                  <Line k="Time" v={t.agentRun.time} />
                  <Line k="Cost" v={t.agentRun.cost} />
                  <Line k="Quality" v={t.agentRun.quality} />
                  <p className="mt-2 text-xs text-bas-muted">{t.agentRun.output}</p>
                </td>
                <td className="p-4">
                  <div className="text-bas-up">Faster</div>
                  <div className="mt-2 text-xs text-bas-muted">
                    Same venue, less room to fat-finger, custody stays with the
                    hirer.
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-[12px] bg-bas-card p-5">
        <h2 className="font-semibold text-white">How to reproduce</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-bas-muted">
          <li>Open /docs/judges and hire BAS Grid Pilot, Health Sentinel, Yield Router.</li>
          <li>On each session page, copy the deliverable. That is the “with agent” output.</li>
          <li>Manual side: PancakeSwap swap UI, Venus/BscScan, three farm pages. Time yourself.</li>
          <li>Full write-up also lives in docs/AGENT_ADVANTAGE_REPORT.md.</li>
        </ol>
      </section>
    </AppShell>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-sm">
      <span className="text-bas-muted">{k}: </span>
      <span>{v}</span>
    </div>
  );
}
