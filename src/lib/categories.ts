import type { Category, CategoryFilter } from "@/lib/agents/types";

export const CATEGORY_META: Record<
  Exclude<Category, "uncategorized">,
  { label: string; short: string; job: string; pancake: string }
> = {
  rebalance: {
    label: "Monitoring",
    short: "Rebalance",
    job: "Watches markets, wallets, and LP positions, then acts before the range or book goes idle.",
    pancake: "PancakeSwap V3 NFPM range watch + recenter. Fees keep accruing instead of going idle.",
  },
  grid: {
    label: "Grid trading",
    short: "Grid",
    job: "Places and manages automated grid orders inside a set range.",
    pancake: "Smart Router fills. Output recipient is you. Agent never holds inventory.",
  },
  health: {
    label: "Health factor",
    short: "Health",
    job: "Protects lending positions from liquidation before the health factor breaks.",
    pancake: "Read-only scan of Venus/Lista-style debt. Alerts fire before you get liquidated.",
  },
  yield: {
    label: "Yield",
    short: "Yield",
    job: "Routes liquidity to the highest available APR across farms and fees.",
    pancake: "CAKE + fee yield across V2/V3 and MasterChef. Research first, then move.",
  },
};

export const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rebalance", label: "Monitoring" },
  { id: "grid", label: "Grid trading" },
  { id: "health", label: "Health factor" },
  { id: "yield", label: "Yield" },
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

export function categoryHirePath(cat: Category) {
  if (cat === "rebalance") return "/hire/97-bas-rebalance";
  if (cat === "health") return "/hire/97-bas-health";
  if (cat === "yield") return "/hire/97-bas-yield";
  return "/hire/97-bas-grid";
}

export function agentStory(agent: {
  category: Category;
  categoryReason: string;
  job?: string;
  pancake?: string;
}) {
  const cat = agent.category !== "uncategorized" ? CATEGORY_META[agent.category] : null;
  return {
    job: agent.job?.trim() || cat?.job || agent.categoryReason,
    pancake: agent.pancake?.trim() || cat?.pancake || "",
  };
}
