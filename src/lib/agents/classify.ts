import type { Category } from "@/lib/agents/types";

const RULES: { cat: Exclude<Category, "uncategorized">; needles: string[] }[] = [
  {
    cat: "rebalance",
    needles: [
      "monitor",
      "monitoring",
      "watch",
      "watcher",
      "rebalance",
      "rebalancing",
      "lp range",
      "range",
      "position manager",
      "nfpm",
      "liquidity range",
      "recenter",
      "concentrated",
      "wallet watch",
      "position watch",
    ],
  },
  {
    cat: "grid",
    needles: [
      "grid",
      "grid trading",
      "dca",
      "limit order",
      "order book",
      "market making",
      "mm bot",
    ],
  },
  {
    cat: "yield",
    needles: [
      "yield",
      "apr",
      "apy",
      "farm",
      "masterchef",
      "vault",
      "optimis",
      "cake reward",
    ],
  },
  {
    cat: "health",
    needles: [
      "health factor",
      "liquidation",
      "ltv",
      "collateral",
      "venus",
      "lista",
      "lending",
      "solvency",
    ],
  },
];

export function classifyAgent(input: {
  name?: string | null;
  description?: string | null;
  tags?: string[] | null;
  categories?: string[] | null;
}): { category: Category; reason: string } {
  const hay = [
    input.name,
    input.description,
    ...(input.tags ?? []),
    ...(input.categories ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!hay.trim()) {
    return {
      category: "uncategorized",
      reason: "No name, description, tags, or skills to classify.",
    };
  }

  for (const rule of RULES) {
    const hit = rule.needles.find((n) => hay.includes(n));
    if (hit) {
      return { category: rule.cat, reason: `Matched “${hit}” in metadata.` };
    }
  }

  return {
    category: "uncategorized",
    reason: "Metadata does not map to monitoring, grid, yield, or health.",
  };
}
