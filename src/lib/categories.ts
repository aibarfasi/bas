import type { Category, CategoryFilter } from "@/lib/agents/types";

export const CATEGORY_META: Record<
  Exclude<Category, "uncategorized">,
  { label: string; short: string; job: string; pancake: string }
> = {
  rebalance: {
    label: "Monitoring",
    short: "Monitor",
    job: "Watches markets, wallets, and LP positions, then acts before the range or book goes idle.",
    pancake: "PancakeSwap V3 NFPM range watch + recenter. Fees keep accruing instead of going idle.",
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
  { id: "rebalance", label: "Monitoring" },
  { id: "grid", label: "Grid trading" },
  { id: "yield", label: "Yield" },
  { id: "health", label: "Health factor" },
];

export function categoryLabel(cat: Category) {
  if (cat === "uncategorized") return "Uncategorized";
  return CATEGORY_META[cat].label;
}

export function normalizeCat(cat?: string | null): CategoryFilter {
  if (cat === "monitoring" || cat === "rebalance") return "rebalance";
  if (cat === "grid" || cat === "yield" || cat === "health" || cat === "all") {
    return cat;
  }
  return "all";
}

export function catQuery(id: CategoryFilter) {
  if (id === "all") return "";
  if (id === "rebalance") return "monitoring";
  return id;
}
