import type { AgentDraft, AgentPatch } from "@/lib/admin/types";
import type { MarketplaceAgent } from "@/lib/agents/types";

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function emptyDraft(): AgentDraft {
  return {
    name: "",
    description: "",
    category: "grid",
    tokenId: "",
    chainId: 97,
    owner: "",
    agentWallet: "",
    priceUsd: 0.15,
    featured: true,
    hireable: true,
    live: true,
    verified: false,
    spendCap: "0.05",
    spendToken: "BNB",
    expiryHours: 24,
    txHash: "",
    registry: "",
    categoryReason: "",
    notes: "",
    job: "",
    pancake: "",
    liveReason: "",
    x402: true,
    protocols: "A2A, X402",
    totalScore: 0,
    averageScore: 0,
    feedbackCount: 0,
    healthScore: "",
    winRate: "",
    window: "30d",
    maxDrawdown: "",
    fills: "",
    pnlPct: "",
    risk: "",
    venue: "",
    feedback: [],
  };
}

export function agentToDraft(a: MarketplaceAgent, notes = ""): AgentDraft {
  return {
    name: a.name,
    description: a.description,
    category: a.category,
    tokenId: a.tokenId,
    chainId: a.chainId,
    owner: a.owner,
    agentWallet: a.agentWallet ?? "",
    priceUsd: a.priceUsd ?? 0,
    featured: a.featured,
    hireable: a.hireable,
    live: a.live === true,
    verified: a.verified,
    spendCap: a.policy?.spendCap ?? "0.05",
    spendToken: a.policy?.spendToken ?? "BNB",
    expiryHours: a.policy?.expiryHours ?? 24,
    txHash: a.txHash ?? "",
    registry: a.registry,
    categoryReason: a.categoryReason,
    notes,
    job: a.job ?? "",
    pancake: a.pancake ?? "",
    liveReason: a.liveReason ?? "",
    x402: a.x402,
    protocols: a.protocols.join(", "),
    totalScore: a.totalScore,
    averageScore: a.averageScore,
    feedbackCount: a.feedbackCount,
    healthScore: a.healthScore == null ? "" : String(a.healthScore),
    winRate: a.metrics.winRate == null ? "" : String(a.metrics.winRate),
    window: a.metrics.window ?? "",
    maxDrawdown: a.metrics.maxDrawdown == null ? "" : String(a.metrics.maxDrawdown),
    fills: a.metrics.fills == null ? "" : String(a.metrics.fills),
    pnlPct: a.metrics.pnlPct == null ? "" : String(a.metrics.pnlPct),
    risk: a.metrics.risk ?? "",
    venue: a.metrics.venue ?? "",
    feedback: a.feedback.map((f) => ({ ...f })),
  };
}

export function looksLikeDraft(body: unknown): body is AgentDraft {
  if (!body || typeof body !== "object") return false;
  const rec = body as Record<string, unknown>;
  return typeof rec.protocols === "string" || typeof rec.winRate === "string";
}

export function previewFromDraft(base: MarketplaceAgent | null, d: AgentDraft): MarketplaceAgent {
  const id = base?.id ?? `${d.chainId}-${d.tokenId || "new"}`;
  const p = draftToPatch(id, d);
  return {
    id,
    tokenId: d.tokenId || base?.tokenId || "new",
    chainId: d.chainId,
    registry: d.registry || base?.registry || "",
    name: d.name || "Untitled seller",
    description: d.description,
    owner: d.owner || base?.owner || "",
    agentWallet: d.agentWallet || d.owner || null,
    category: d.category,
    categoryReason: d.categoryReason,
    featured: d.featured,
    hireable: d.hireable,
    live: d.live,
    liveReason: d.liveReason || (d.live ? "Marked live by operator." : "Marked down by operator."),
    liveLocked: true,
    x402: d.x402,
    protocols: p.protocols ?? [],
    services: base?.services ?? [],
    totalScore: d.totalScore,
    averageScore: d.averageScore,
    feedbackCount: d.feedbackCount || d.feedback.length,
    healthScore: p.healthScore ?? null,
    verified: d.verified,
    createdAt: base?.createdAt ?? new Date().toISOString(),
    txHash: d.txHash || null,
    imageUrl: base?.imageUrl ?? null,
    metrics: {
      winRate: p.winRate ?? null,
      window: p.window ?? null,
      maxDrawdown: p.maxDrawdown ?? null,
      fills: p.fills ?? null,
      pnlPct: p.pnlPct ?? null,
      risk: p.risk ?? null,
      venue: p.venue ?? null,
    },
    policy: {
      wallet: d.agentWallet || d.owner || base?.policy?.wallet || "",
      allowlist: base?.policy?.allowlist ?? [],
      spendCap: d.spendCap,
      spendToken: d.spendToken,
      expiryHours: d.expiryHours,
    },
    priceUsd: d.priceUsd,
    feedback: d.feedback,
    source: base?.source ?? "featured",
    job: d.job,
    pancake: d.pancake,
  };
}

export function draftToPatch(id: string, d: AgentDraft): AgentPatch {
  return {
    id,
    name: d.name,
    description: d.description,
    category: d.category,
    tokenId: d.tokenId,
    chainId: d.chainId,
    owner: d.owner,
    agentWallet: d.agentWallet || d.owner,
    priceUsd: d.priceUsd,
    featured: d.featured,
    hireable: d.hireable,
    live: d.live,
    verified: d.verified,
    spendCap: d.spendCap,
    spendToken: d.spendToken,
    expiryHours: d.expiryHours,
    txHash: d.txHash || null,
    registry: d.registry,
    categoryReason: d.categoryReason,
    notes: d.notes,
    job: d.job,
    pancake: d.pancake,
    liveReason: d.liveReason,
    x402: d.x402,
    protocols: d.protocols
      .split(/[,·]/)
      .map((s) => s.trim())
      .filter(Boolean),
    totalScore: d.totalScore,
    averageScore: d.averageScore,
    feedbackCount: d.feedbackCount || d.feedback.length,
    healthScore: num(d.healthScore),
    winRate: num(d.winRate),
    window: d.window || null,
    maxDrawdown: num(d.maxDrawdown),
    fills: num(d.fills),
    pnlPct: num(d.pnlPct),
    risk: d.risk || null,
    venue: d.venue || null,
    feedback: d.feedback,
  };
}
