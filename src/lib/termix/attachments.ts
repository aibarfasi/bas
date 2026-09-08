import { pancakePoolGap, pancakeYieldBoard, quotePancakeSwap } from "@/lib/pancake/quote";

export async function termixAttachments() {
  const quote = await quotePancakeSwap({ amountIn: "0.05" });
  const yields = pancakeYieldBoard();
  const gap = pancakePoolGap();
  return {
    generatedAt: new Date().toISOString(),
    tasks: {
      trade: {
        agent: "BAS Grid Pilot",
        hire: "/hire/97-bas-grid",
        title: "Grid fill (no custody)",
        quote,
        custody: "Output recipient is the hirer. Agent never holds inventory. minOut is never 0.",
      },
      security: {
        agent: "BAS Health Sentinel",
        hire: "/hire/97-bas-health",
        title: "Health-factor brief",
        healthFactor: 1.14,
        timeToLiqStress8pct: "~4h",
        action: "Repay 12% or add BNB collateral",
        custody: "Read-only. Empty allowlist.",
      },
      yield: {
        agent: "BAS Yield Router",
        hire: "/hire/97-bas-yield",
        title: "Yield ranking",
        board: yields,
        poolGap: gap,
      },
      equities: {
        agent: "BAS Equity Scout",
        hire: "/hire/97-bas-equity",
        title: "Equity swing brief",
        bias: "BNB fade vs BTCB",
        hedge: "Keep ETH sleeve",
        invalidation: "BNB +4% vs 7d VWAP",
        custody: "Research only. You place the trade.",
      },
    },
  };
}
