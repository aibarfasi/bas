import type { MarketplaceAgent } from "@/lib/agents/types";
import { hireKind } from "@/lib/hire/kind";

export type HireBrief = {
  eyebrow: string;
  lead: string;
  deliverable: string[];
  lockCap: boolean;
  defaultCap: string;
};

export function hireBrief(agent: MarketplaceAgent): HireBrief {
  const kind = hireKind(agent);
  if (kind === "health") {
    return {
      eyebrow: "Security · health factor",
      lead: "Read-only. Empty allowlist. Spend cap stays 0. You get a liquidation brief; nothing moves unless you sign later.",
      deliverable: [
        "Current health factor",
        "Time-to-liq under an −8% shock",
        "Repay or add-collateral size",
      ],
      lockCap: true,
      defaultCap: "0",
    };
  }
  if (kind === "equities") {
    return {
      eyebrow: "Equities · research",
      lead: "Swing book only. Bias, hedge, and invalidation. You still place the trade.",
      deliverable: ["Bias vs BTCB", "ETH hedge", "Written invalidation"],
      lockCap: true,
      defaultCap: "0",
    };
  }
  if (kind === "rebalance") {
    return {
      eyebrow: "Monitoring · LP range",
      lead: "Watches the V3 NFT and recenters before fees die. The NFT stays in your wallet.",
      deliverable: ["Range vs mid", "New ticks", "Custody: NFT never transferred"],
      lockCap: false,
      defaultCap: agent.policy?.spendCap ?? "0.05",
    };
  }
  if (kind === "yield") {
    return {
      eyebrow: "Yield · Pancake farms",
      lead: "Ranks CAKE + fee APR, then flags where a new pool would capture flow. Research first.",
      deliverable: ["Top farms by total APR", "TVL + IL note", "Pool-gap (new fee tier)"],
      lockCap: false,
      defaultCap: agent.policy?.spendCap ?? "0.05",
    };
  }
  return {
    eyebrow: "Grid · Pancake Smart Router",
    lead: "Quoted fill. minOut is never 0. Output recipient is you. The agent never holds inventory.",
    deliverable: ["Pair + amount out", "minOut floor", "Recipient locked to your wallet"],
    lockCap: false,
    defaultCap: agent.policy?.spendCap ?? "0.05",
  };
}
