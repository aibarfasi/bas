import "server-only";
import { FEATURED_AGENTS } from "@/lib/agents/featured";
import type { MarketplaceAgent } from "@/lib/agents/types";
import {
  applyPatchToAgent,
  getCustomAgents,
  getOverrides,
  getSettings,
} from "@/lib/admin/store";

function applyDeploy(agent: MarketplaceAgent): MarketplaceAgent {
  const map = getSettings().deployments[agent.id];
  if (!map) return agent;
  const chainId = map.chainId ?? agent.chainId;
  const tokenId = map.tokenId ?? agent.tokenId;
  return {
    ...agent,
    chainId,
    tokenId,
    id: `${chainId}-${tokenId}`,
    txHash: map.txHash === undefined ? agent.txHash : map.txHash,
  };
}

export function resolveFeaturedAgents(): MarketplaceAgent[] {
  const overrides = getOverrides();
  const listed = [...FEATURED_AGENTS.map((a) => ({ ...a })), ...getCustomAgents().map((a) => ({ ...a }))];
  return listed
    .map(applyDeploy)
    .map((a) => applyPatchToAgent(a, overrides[a.id] ?? overrides[`${a.chainId}-${a.tokenId}`]))
    .filter((a) => !overrides[a.id]?.hidden);
}

export function applyAdminCatalog(agents: MarketplaceAgent[]): MarketplaceAgent[] {
  const overrides = getOverrides();
  const hideUncat = getSettings().hideUncategorized;
  return agents
    .map((a) => applyPatchToAgent(a, overrides[a.id]))
    .filter((a) => {
      if (overrides[a.id]?.hidden) return false;
      if (hideUncat && a.category === "uncategorized" && !a.featured) return false;
      return true;
    });
}

export function resolveAgentById(id: string) {
  const listed = resolveFeaturedAgents();
  const direct = listed.find((a) => a.id === id);
  if (direct) return direct;
  const patch = getOverrides()[id];
  if (!patch) return null;
  return (
    listed.find(
      (a) =>
        (patch.tokenId == null || a.tokenId === patch.tokenId) &&
        (patch.chainId == null || a.chainId === patch.chainId),
    ) ?? null
  );
}

export function findResolved(chainId: number, tokenId: string) {
  return (
    resolveFeaturedAgents().find(
      (a) => a.chainId === chainId && a.tokenId === tokenId,
    ) ?? null
  );
}

export function isHidden(id: string) {
  return Boolean(getOverrides()[id]?.hidden);
}
