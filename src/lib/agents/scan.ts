import { classifyAgent } from "@/lib/agents/classify";
import { findFeatured, FEATURED_AGENTS } from "@/lib/agents/featured";
import type { MarketplaceAgent, AgentService } from "@/lib/agents/types";

const SCAN = "https://8004scan.io/api/v1/public";

type ScanAgent = {
  token_id?: string;
  chain_id?: number;
  contract_address?: string;
  name?: string | null;
  description?: string | null;
  owner_address?: string | null;
  agent_wallet?: string | null;
  image_url?: string | null;
  is_verified?: boolean;
  x402_supported?: boolean;
  supported_protocols?: string[] | null;
  services?: Record<string, { endpoint?: string; version?: string } | null> | null;
  total_score?: number | null;
  average_score?: number | null;
  total_feedbacks?: number | null;
  health_score?: number | null;
  created_at?: string | null;
  created_tx_hash?: string | null;
  tags?: string[] | null;
  categories?: string[] | null;
  is_active?: boolean | null;
  is_testnet?: boolean | null;
};

async function scanGet<T>(path: string): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(`${SCAN}${path}`, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function servicesFrom(raw: ScanAgent["services"]): AgentService[] {
  if (!raw) return [];
  const out: AgentService[] = [];
  for (const key of ["a2a", "mcp", "x402", "web"] as const) {
    const s = raw[key];
    if (s?.endpoint) {
      out.push({ name: key, endpoint: s.endpoint, version: s.version ?? null });
    }
  }
  return out;
}

export function mapScanAgent(raw: ScanAgent): MarketplaceAgent | null {
  const tokenId = raw.token_id;
  const chainId = raw.chain_id;
  if (!tokenId || !chainId) return null;
  const { category, reason } = classifyAgent({
    name: raw.name,
    description: raw.description,
    tags: raw.tags,
    categories: raw.categories,
  });
  const protocols = raw.supported_protocols ?? [];
  return {
    id: `${chainId}-${tokenId}`,
    tokenId,
    chainId,
    registry: raw.contract_address ?? "",
    name: raw.name?.trim() || `Agent #${tokenId}`,
    description: raw.description?.trim() || "",
    owner: raw.owner_address ?? "",
    agentWallet: raw.agent_wallet ?? raw.owner_address ?? null,
    category,
    categoryReason: reason,
    featured: false,
    hireable: false,
    live: raw.is_active ?? null,
    liveReason:
      raw.is_active === false
        ? "8004scan marks this agent inactive."
        : raw.is_active
          ? "Marked active on 8004scan. Endpoint not independently probed."
          : "No liveness signal from 8004scan.",
    x402: Boolean(raw.x402_supported),
    protocols,
    services: servicesFrom(raw.services),
    totalScore: Number(raw.total_score ?? 0),
    averageScore: Number(raw.average_score ?? 0),
    feedbackCount: Number(raw.total_feedbacks ?? 0),
    healthScore: raw.health_score ?? null,
    verified: Boolean(raw.is_verified),
    createdAt: raw.created_at ?? new Date().toISOString(),
    txHash: raw.created_tx_hash ?? null,
    imageUrl: raw.image_url ?? null,
    metrics: {
      winRate: null,
      window: null,
      maxDrawdown: null,
      fills: null,
      pnlPct: null,
      risk: null,
      venue: protocols.length ? protocols.join(" · ") : null,
    },
    policy: null,
    priceUsd: null,
    feedback: [],
    source: "8004scan",
    filteredReason:
      category === "uncategorized" ? reason : undefined,
  };
}

export async function listScanAgents(limit = 48): Promise<{
  agents: MarketplaceAgent[];
  totalOnBsc: number;
}> {
  const body = await scanGet<{
    success?: boolean;
    data?: ScanAgent[];
    meta?: { pagination?: { total?: number } };
  }>(`/agents?limit=${limit}`);
  const mapped = (body?.data ?? [])
    .map(mapScanAgent)
    .filter((a): a is MarketplaceAgent => Boolean(a))
    .filter((a) => a.chainId === 56 || a.chainId === 97);
  return {
    agents: mapped,
    totalOnBsc: body?.meta?.pagination?.total ?? mapped.length,
  };
}

export async function getScanAgent(
  chainId: number,
  tokenId: string,
): Promise<MarketplaceAgent | null> {
  const featured = findFeatured(chainId, tokenId);
  if (featured) return featured;
  const body = await scanGet<{ success?: boolean; data?: ScanAgent }>(
    `/agents/${chainId}/${encodeURIComponent(tokenId)}`,
  );
  if (!body?.data) return null;
  return mapScanAgent(body.data);
}

export async function getMarketplaceCatalog(): Promise<{
  agents: MarketplaceAgent[];
  totalOnBsc: number;
}> {
  const { agents, totalOnBsc } = await listScanAgents(60);
  const seen = new Set(FEATURED_AGENTS.map((a) => a.id));
  const rest = agents.filter((a) => !seen.has(a.id));
  return { agents: [...FEATURED_AGENTS, ...rest], totalOnBsc };
}

export async function getScanStats() {
  const body = await scanGet<{
    data?: { total_agents?: number; average_feedback_score?: number };
  }>("/stats");
  return body?.data ?? null;
}
