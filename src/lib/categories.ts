import type { Category, CategoryFilter } from "@/lib/agents/types";

export const CATEGORY_META: Record<
  Exclude<Category, "uncategorized">,
  { label: string; short: string; job: string; pancake: string }
> = {
  rebalance: {
    label: "Rebalancing",
    short: "Rebalance",
    job: "Manages LP ranges and resets positions automatically as price drifts.",
    pancake: "PancakeSwap V3 NFPM range recenter. Fees keep accruing instead of going idle.",
  },
  grid: {
    label: "Grid trading",
    short: "Grid",
    job: "Places and manages automated grid orders inside a set range.",
    pancake: "Smart Router fills. Output recipient is you. Agent never holds inventory.",
  },
  yield: {
    label: "Yield optimisation",
    short: "Yield",
    job: "Routes liquidity to the highest available APR across farms and fees.",
    pancake: "CAKE + fee yield across V2/V3 and MasterChef. Research first, then move.",
  },
  health: {
    label: "Health factor",
    short: "Health",
    job: "Protects lending positions from liquidation before the health factor breaks.",
    pancake: "Read-only scan of Venus/Lista-style debt. Alerts fire before you get liquidated.",
  },
};

export const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rebalance", label: "Rebalancing" },
  { id: "grid", label: "Grid trading" },
  { id: "yield", label: "Yield" },
  { id: "health", label: "Health factor" },
];

export function categoryLabel(cat: Category) {
  if (cat === "uncategorized") return "Uncategorized";
  return CATEGORY_META[cat].label;
}
