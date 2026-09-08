import type { MarketplaceAgent } from "@/lib/agents/types";
import { BRIEF_COMPARE_IDS } from "@/lib/compare/sellers";

export const TRENDING_LIMIT = 4;

export const DEFAULT_TRENDING_IDS: string[] = [...BRIEF_COMPARE_IDS];

export function sanitizeTrendingIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [...DEFAULT_TRENDING_IDS];
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && Boolean(id)))].slice(
    0,
    TRENDING_LIMIT,
  );
}

export function nextTrendingIds(current: string[], id: string, on: boolean) {
  if (on) {
    if (current.includes(id)) return current;
    return [...current, id].slice(-TRENDING_LIMIT);
  }
  return current.filter((x) => x !== id);
}

export function pickTrendingAgents(agents: MarketplaceAgent[], ids: string[]) {
  const byId = new Map(agents.map((a) => [a.id, a]));
  return ids.map((id) => byId.get(id)).filter((a): a is MarketplaceAgent => Boolean(a));
}
