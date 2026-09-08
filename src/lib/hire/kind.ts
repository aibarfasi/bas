import type { MarketplaceAgent } from "@/lib/agents/types";

export function hireKind(agent: MarketplaceAgent) {
  if (agent.tokenId === "bas-equity") return "equities";
  if (agent.category === "uncategorized") return "yield";
  return agent.category;
}
