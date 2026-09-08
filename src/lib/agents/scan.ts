import { classifyAgent } from "@/lib/agents/classify";
import { applyAdminCatalog, findResolved, resolveFeaturedAgents, resolvePublicAgent } from "@/lib/admin/catalog";
import { getSettings, hydrateFromSql } from "@/lib/admin/store";
import type { AgentFeedback, AgentService, MarketplaceAgent } from "@/lib/agents/types";

const SCAN = "https://8004scan.io/api/v1/public";

const SEARCHES = [
  { q: "monitoring rebalance LP range" },
  { q: "grid trading" },
  { q: "health factor liquidation" },
  { q: "yield farm APR" },
];

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
  feedbacks?: ScanFeedback[] | null;
};

type ScanFeedback = {
  chain_id?: number;
  token_id?: string | number;
  agent_id?: string;
  client_address?: string;
  client?: string;
  from_address?: string;
  score?: number;
  value?: number;
  tag?: string;
  comment?: string;
  text?: string;
  created_at?: string;
  timestamp?: string;
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

function mapFeedback(raw: ScanFeedback, fallback?: { chainId: number; tokenId: string }): AgentFeedback | null {
  const score = Number(raw.score ?? raw.value ?? 0);
  const comment = (raw.comment ?? raw.text ?? "").trim();
  if (!score && !comment) return null;
  return {
    client: raw.client_address ?? raw.client ?? raw.from_address ?? fallback?.tokenId ?? "8004scan",
    score,
    tag: raw.tag ?? "quality",
    comment: comment || "On-chain feedback indexed by 8004scan.",
    at: raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
  };
}

function feedbackKey(raw: ScanFeedback) {
  if (raw.chain_id && raw.token_id != null) return `${raw.chain_id}-${raw.token_id}`;
  const parts = String(raw.agent_id ?? "").split(":");
  if (parts.length >= 3) return `${parts[0]}-${parts[parts.length - 1]}`;
  if (parts.length === 2) return `${parts[0]}-${parts[1]}`;
  return null;
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
  const embedded = (raw.feedbacks ?? [])
    .map((f) => mapFeedback(f, { chainId, tokenId }))
    .filter((f): f is AgentFeedback => Boolean(f));
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
    feedbackCount: Number(raw.total_feedbacks ?? embedded.length),
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
    feedback: embedded,
    source: "8004scan",
    filteredReason: category === "uncategorized" ? reason : undefined,
  };
}

function bscOnly(agents: MarketplaceAgent[]) {
  return agents.filter((a) => a.chainId === 56 || a.chainId === 97);
}

function mergeAgents(rows: MarketplaceAgent[]) {
  const map = new Map<string, MarketplaceAgent>();
  for (const a of rows) {
    const prev = map.get(a.id);
    if (!prev) {
      map.set(a.id, a);
      continue;
    }
    map.set(a.id, {
      ...prev,
      ...a,
      feedback: a.feedback.length ? a.feedback : prev.feedback,
      feedbackCount: Math.max(a.feedbackCount, prev.feedbackCount),
      services: a.services.length ? a.services : prev.services,
    });
  }
  return [...map.values()];
}

function attachFeedbacks(agents: MarketplaceAgent[], rows: ScanFeedback[]) {
  const buckets = new Map<string, AgentFeedback[]>();
  for (const raw of rows) {
    const key = feedbackKey(raw);
    const mapped = mapFeedback(raw);
    if (!key || !mapped) continue;
    const list = buckets.get(key) ?? [];
    list.push(mapped);
    buckets.set(key, list);
  }
  return agents.map((a) => {
    const extra = buckets.get(a.id);
    if (!extra?.length) return a;
    const feedback = extra.slice(0, 8);
    return {
      ...a,
      feedback,
      feedbackCount: Math.max(a.feedbackCount, extra.length),
    };
  });
}

export function sortCatalog(agents: MarketplaceAgent[]) {
  return [...agents].sort((a, b) => {
    const hire = Number(b.hireable) - Number(a.hireable);
    if (hire) return hire;
    const feat = Number(b.featured) - Number(a.featured);
    if (feat) return feat;
    const x = Number(b.x402) - Number(a.x402);
    if (x) return x;
    return b.totalScore - a.totalScore;
  });
}

export async function listScanAgents(limit = 48): Promise<{
  agents: MarketplaceAgent[];
  totalOnBsc: number;
}> {
  const list = scanGet<{
    success?: boolean;
    data?: ScanAgent[];
    meta?: { pagination?: { total?: number } };
  }>(`/agents?limit=${limit}`);
  const searches = SEARCHES.map((s) =>
    scanGet<{ data?: ScanAgent[] }>(`/agents/search?q=${encodeURIComponent(s.q)}&limit=12`),
  );
  const feedbacks = scanGet<{ data?: ScanFeedback[] }>("/feedbacks?limit=80");
  const stats = getScanStats();

  const [listed, fb, st, ...found] = await Promise.all([list, feedbacks, stats, ...searches]);

  const mapped = mergeAgents(
    bscOnly(
      [
        ...(listed?.data ?? []),
        ...found.flatMap((body) => body?.data ?? []),
      ]
        .map(mapScanAgent)
        .filter((a): a is MarketplaceAgent => Boolean(a)),
    ),
  );
  const withFb = attachFeedbacks(mapped, fb?.data ?? []);
  const totalOnBsc =
    listed?.meta?.pagination?.total ??
    st?.total_agents ??
    withFb.length;
  return { agents: sortCatalog(withFb), totalOnBsc };
}

export async function getScanAgent(
  chainId: number,
  tokenId: string,
): Promise<MarketplaceAgent | null> {
  const featured = findResolved(chainId, tokenId);
  if (featured) return featured;
  const [body, fb] = await Promise.all([
    scanGet<{ success?: boolean; data?: ScanAgent }>(
      `/agents/${chainId}/${encodeURIComponent(tokenId)}`,
    ),
    scanGet<{ data?: ScanFeedback[] }>(
      `/agents/${chainId}/${encodeURIComponent(tokenId)}/feedbacks?limit=12`,
    ),
  ]);
  if (!body?.data) return null;
  const mapped = mapScanAgent(body.data);
  if (!mapped) return null;
  const withFb = attachFeedbacks(
    [mapped],
    [...(fb?.data ?? []), ...(body.data.feedbacks ?? [])],
  );
  return resolvePublicAgent(withFb[0] ?? mapped);
}

export async function getMarketplaceCatalog(): Promise<{
  agents: MarketplaceAgent[];
  totalOnBsc: number;
}> {
  await hydrateFromSql();
  const { agents, totalOnBsc } = await listScanAgents(40);
  const featured = resolveFeaturedAgents();
  const seen = new Set(featured.map((a) => a.id));
  const rest = applyAdminCatalog(agents.filter((a) => !seen.has(a.id)));
  return { agents: sortCatalog(applyAdminCatalog([...featured, ...rest])), totalOnBsc };
}

export function catalogTrendingIds() {
  return getSettings().trendingIds;
}

export async function getScanStats() {
  const body = await scanGet<{
    data?: { total_agents?: number; average_feedback_score?: number };
  }>("/stats");
  return body?.data ?? null;
}

export function publishedX402(agent: MarketplaceAgent) {
  return agent.services.find((s) => s.name === "x402" && s.endpoint)?.endpoint ?? null;
}
