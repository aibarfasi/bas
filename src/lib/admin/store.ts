import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { PANCAKE, PANCAKE_ALLOWLIST } from "@/lib/pancake/allowlist";
import type {
  AdminState,
  AgentDraft,
  AgentPatch,
  AllowlistItem,
  AuditEvent,
  SiteSettings,
} from "@/lib/admin/types";
import { draftToPatch } from "@/lib/admin/draft";
import type { MarketplaceAgent } from "@/lib/agents/types";
import type { HiredSession } from "@/lib/altana/sessions";
import type { SessionReceipt } from "@/lib/altana/ledger";
import type { HireJob } from "@/lib/hire/types";
import type { SellerClaim } from "@/lib/claim/types";
import type { X402Receipt } from "@/lib/x402/receipts";
import { DEFAULT_TRENDING_IDS, sanitizeTrendingIds } from "@/lib/agents/trending";
import { loadSqlJson, saveSqlJson } from "@/lib/persist/sql";

const FILE = join(process.cwd(), "data", "admin.json");

export const DEFAULT_SETTINGS: SiteSettings = {
  prizeWallet: "0xFFF78E63181220Ca6F5FaA76bec1D2FaC01035A8",
  intakeUrl: "https://forms.gle/9g9XPNFwnYaHAz9L8",
  liveUrl: "https://bas-sigma-eight.vercel.app",
  repoUrl: "https://github.com/aibarfasi/bas",
  notice: "",
  maintenance: false,
  hideUncategorized: false,
  intakeSubmitted: false,
  deployments: {},
  trendingIds: [...DEFAULT_TRENDING_IDS],
};

function emptyState(): AdminState {
  return {
    overrides: {},
    custom: [],
    settings: { ...DEFAULT_SETTINGS, deployments: {} },
    allowlist: [],
    audit: [],
    sessions: [],
    jobs: [],
    altanaReceipts: [],
    x402Receipts: [],
    claims: [],
  };
}

const g = globalThis as typeof globalThis & { __basAdmin?: AdminState };

function loadFromDisk(): AdminState | null {
  try {
    if (!existsSync(FILE)) return null;
    const raw = JSON.parse(readFileSync(FILE, "utf8")) as Partial<AdminState>;
    const base = emptyState();
    return {
      ...base,
      ...raw,
      overrides: raw.overrides ?? {},
      custom: raw.custom ?? [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...raw.settings,
        deployments: raw.settings?.deployments ?? {},
        trendingIds: sanitizeTrendingIds(raw.settings?.trendingIds ?? DEFAULT_SETTINGS.trendingIds),
      },
      allowlist: raw.allowlist ?? [],
      audit: raw.audit ?? [],
      sessions: raw.sessions ?? [],
      jobs: raw.jobs ?? [],
      altanaReceipts: raw.altanaReceipts ?? [],
      x402Receipts: raw.x402Receipts ?? [],
      claims: raw.claims ?? [],
    };
  } catch {
    return null;
  }
}

function persist(state: AdminState) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(FILE, JSON.stringify(state, null, 2));
  } catch {
    // Vercel / read-only FS — keep memory only.
  }
  void saveSqlJson("admin", state);
}

function state(): AdminState {
  if (!g.__basAdmin) g.__basAdmin = loadFromDisk() ?? emptyState();
  return g.__basAdmin;
}

const gHydrate = globalThis as typeof globalThis & { __basSqlHydrated?: boolean };

export async function hydrateFromSql() {
  if (gHydrate.__basSqlHydrated) return;
  gHydrate.__basSqlHydrated = true;
  const remote = await loadSqlJson<AdminState>("admin");
  if (!remote) return;
  const cur = g.__basAdmin;
  const empty =
    !cur ||
    (!cur.sessions.length &&
      !(cur.altanaReceipts?.length) &&
      !(cur.x402Receipts?.length) &&
      !cur.jobs.length &&
      !Object.keys(cur.overrides ?? {}).length);
  if (empty) {
    g.__basAdmin = {
      ...emptyState(),
      ...remote,
      overrides: remote.overrides ?? {},
      custom: remote.custom ?? [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...remote.settings,
        deployments: remote.settings?.deployments ?? {},
        trendingIds: sanitizeTrendingIds(remote.settings?.trendingIds ?? DEFAULT_SETTINGS.trendingIds),
      },
      allowlist: remote.allowlist ?? [],
      audit: remote.audit ?? [],
      sessions: remote.sessions ?? [],
      jobs: remote.jobs ?? [],
      altanaReceipts: remote.altanaReceipts ?? [],
      x402Receipts: remote.x402Receipts ?? [],
      claims: remote.claims ?? [],
    };
  }
}

function commit(next: Partial<AdminState>, action: string, detail: string) {
  const cur = state();
  const event: AuditEvent = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    action,
    detail,
  };
  Object.assign(cur, next, {
    audit: [event, ...cur.audit].slice(0, 80),
  });
  persist(cur);
  return cur;
}

export function getAdminState() {
  return state();
}

export function loadPersistedHires() {
  const cur = state();
  return { sessions: cur.sessions, jobs: cur.jobs };
}

export function persistHires(sessions: HiredSession[], jobs: HireJob[]) {
  const cur = state();
  cur.sessions = sessions;
  cur.jobs = jobs;
  persist(cur);
}

export function listAltanaReceipts() {
  return [...(state().altanaReceipts ?? [])].sort((a, b) => b.createdAt - a.createdAt).slice(0, 80);
}

export function putAltanaReceipt(r: SessionReceipt) {
  const cur = state();
  cur.altanaReceipts = [r, ...(cur.altanaReceipts ?? []).filter((x) => x.id !== r.id)].slice(0, 80);
  persist(cur);
  return r;
}

export function getAltanaReceipt(id: string) {
  return (state().altanaReceipts ?? []).find((r) => r.id === id) ?? null;
}

export function listX402Receipts() {
  return [...(state().x402Receipts ?? [])].sort((a, b) => b.paidAt - a.paidAt).slice(0, 80);
}

export function putX402Receipt(r: X402Receipt) {
  const cur = state();
  cur.x402Receipts = [r, ...(cur.x402Receipts ?? []).filter((x) => x.id !== r.id)].slice(0, 80);
  persist(cur);
  return r;
}

export function listClaims() {
  return [...(state().claims ?? [])].sort((a, b) => b.at - a.at);
}

export function putClaim(c: SellerClaim) {
  const cur = state();
  cur.claims = [c, ...(cur.claims ?? []).filter((x) => x.agentId !== c.agentId)].slice(0, 120);
  persist(cur);
  return c;
}

export function getClaim(agentId: string) {
  return (state().claims ?? []).find((c) => c.agentId === agentId) ?? null;
}

export function getSettings() {
  const cur = state().settings;
  return {
    ...DEFAULT_SETTINGS,
    ...cur,
    deployments: cur.deployments ?? {},
    trendingIds: sanitizeTrendingIds(cur.trendingIds),
  };
}

export function updateSettings(patch: Partial<SiteSettings>) {
  const settings = { ...state().settings, ...patch };
  if (patch.deployments) settings.deployments = { ...state().settings.deployments, ...patch.deployments };
  if (patch.trendingIds) settings.trendingIds = sanitizeTrendingIds(patch.trendingIds);
  commit({ settings }, "settings.update", Object.keys(patch).join(", "));
  return getSettings();
}

export function getOverrides() {
  return state().overrides;
}

export function getCustomAgents() {
  return state().custom;
}

export function putOverride(patch: AgentPatch) {
  const overrides = { ...state().overrides, [patch.id]: { ...state().overrides[patch.id], ...patch } };
  commit({ overrides }, "agent.patch", patch.id);
  return overrides[patch.id];
}

export function putOverrides(patches: AgentPatch[]) {
  const overrides = { ...state().overrides };
  for (const patch of patches) {
    overrides[patch.id] = { ...overrides[patch.id], ...patch };
  }
  commit({ overrides }, "agent.bulk", `${patches.length} agents`);
  return overrides;
}

export function exportSnapshot() {
  const cur = state();
  return {
    exportedAt: new Date().toISOString(),
    overrides: cur.overrides,
    custom: cur.custom,
    settings: cur.settings,
    allowlist: cur.allowlist,
    sessions: cur.sessions,
    jobs: cur.jobs,
    altanaReceipts: cur.altanaReceipts,
    x402Receipts: cur.x402Receipts,
    claims: cur.claims,
  };
}

export function importSnapshot(raw: {
  overrides?: AdminState["overrides"];
  custom?: AdminState["custom"];
  settings?: Partial<SiteSettings>;
  allowlist?: AdminState["allowlist"];
  sessions?: AdminState["sessions"];
  jobs?: AdminState["jobs"];
  altanaReceipts?: AdminState["altanaReceipts"];
  x402Receipts?: AdminState["x402Receipts"];
  claims?: AdminState["claims"];
}) {
  commit(
    {
      overrides: raw.overrides ?? state().overrides,
      custom: raw.custom ?? state().custom,
      settings: raw.settings
        ? {
            ...DEFAULT_SETTINGS,
            ...state().settings,
            ...raw.settings,
            deployments: raw.settings.deployments ?? state().settings.deployments,
            trendingIds: sanitizeTrendingIds(raw.settings.trendingIds ?? state().settings.trendingIds),
          }
        : state().settings,
      allowlist: raw.allowlist ?? state().allowlist,
      sessions: raw.sessions ?? state().sessions,
      jobs: raw.jobs ?? state().jobs,
      altanaReceipts: raw.altanaReceipts ?? state().altanaReceipts,
      x402Receipts: raw.x402Receipts ?? state().x402Receipts,
      claims: raw.claims ?? state().claims,
    },
    "snapshot.import",
    "operator snapshot",
  );
  return exportSnapshot();
}

export function clearOverride(id: string) {
  const overrides = { ...state().overrides };
  delete overrides[id];
  commit({ overrides }, "agent.reset", id);
}

export function addCustomAgent(draft: AgentDraft): MarketplaceAgent {
  const id = `${draft.chainId}-${draft.tokenId}`;
  if (state().custom.some((a) => a.id === id)) {
    throw new Error(`Agent ${id} already exists`);
  }
  const face = draft.category === "uncategorized" ? "yield" : draft.category;
  const base: MarketplaceAgent = {
    id,
    tokenId: draft.tokenId,
    chainId: draft.chainId,
    registry: draft.registry || PANCAKE.smartRouter,
    name: draft.name,
    description: draft.description,
    owner: draft.owner,
    agentWallet: draft.agentWallet || draft.owner,
    category: draft.category,
    categoryReason: draft.categoryReason || "Added from the BAS operator console.",
    featured: draft.featured,
    hireable: draft.hireable,
    live: draft.live,
    liveReason: draft.live ? "Marked live by operator." : "Marked down by operator.",
    liveLocked: true,
    x402: draft.x402,
    protocols: [],
    services: draft.hireable
      ? [
          { name: "a2a", endpoint: `/api/hire/faces/${face}/a2a`, version: "0.3.0" },
          { name: "x402", endpoint: `/api/hire/faces/${face}/x402`, version: "1" },
        ]
      : [],
    totalScore: 0,
    averageScore: 0,
    feedbackCount: 0,
    healthScore: null,
    verified: draft.verified,
    createdAt: new Date().toISOString(),
    txHash: draft.txHash || null,
    imageUrl: null,
    metrics: {
      winRate: null,
      window: null,
      maxDrawdown: null,
      fills: null,
      pnlPct: null,
      risk: null,
      venue: null,
    },
    policy: {
      wallet: draft.agentWallet || draft.owner,
      allowlist: getEffectiveAllowlist(),
      spendCap: draft.spendCap,
      spendToken: draft.spendToken,
      expiryHours: draft.expiryHours,
    },
    priceUsd: draft.priceUsd,
    feedback: [],
    source: "featured",
  };
  const agent = applyPatchToAgent(base, draftToPatch(id, draft));
  agent.liveLocked = true;
  commit({ custom: [agent, ...state().custom] }, "agent.create", id);
  if (draft.notes) putOverride({ id, notes: draft.notes });
  return agent;
}

export function removeCustomAgent(id: string) {
  const found = state().custom.some((a) => a.id === id);
  if (!found) throw new Error("Custom agent not found");
  commit(
    { custom: state().custom.filter((a) => a.id !== id) },
    "agent.delete",
    id,
  );
}

export function getEffectiveAllowlist(): AllowlistItem[] {
  const extra = state().allowlist;
  const seen = new Set(PANCAKE_ALLOWLIST.map((a) => a.address.toLowerCase()));
  return [
    ...PANCAKE_ALLOWLIST,
    ...extra.filter((a) => {
      const key = a.address.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
}

export function setAllowlist(items: AllowlistItem[]) {
  commit({ allowlist: items }, "allowlist.replace", `${items.length} contracts`);
  return getEffectiveAllowlist();
}

export function addAllowlistItem(item: AllowlistItem) {
  const extra = [...state().allowlist.filter((a) => a.address.toLowerCase() !== item.address.toLowerCase()), item];
  commit({ allowlist: extra }, "allowlist.add", item.address);
  return getEffectiveAllowlist();
}

export function removeAllowlistItem(address: string) {
  commit(
    { allowlist: state().allowlist.filter((a) => a.address.toLowerCase() !== address.toLowerCase()) },
    "allowlist.remove",
    address,
  );
  return getEffectiveAllowlist();
}

export function listAudit() {
  return state().audit;
}

export function applyPatchToAgent(agent: MarketplaceAgent, patch?: AgentPatch): MarketplaceAgent {
  if (!patch) return agent;
  const next: MarketplaceAgent = { ...agent };
  if (patch.name != null) next.name = patch.name;
  if (patch.description != null) next.description = patch.description;
  if (patch.category != null) next.category = patch.category;
  if (patch.categoryReason != null) next.categoryReason = patch.categoryReason;
  if (patch.featured != null) next.featured = patch.featured;
  if (patch.hireable != null) next.hireable = patch.hireable;
  if (patch.live !== undefined) next.live = patch.live;
  if (patch.verified != null) next.verified = patch.verified;
  if (patch.priceUsd !== undefined) next.priceUsd = patch.priceUsd;
  if (patch.owner != null) next.owner = patch.owner;
  if (patch.agentWallet !== undefined) next.agentWallet = patch.agentWallet;
  if (patch.tokenId != null) next.tokenId = patch.tokenId;
  if (patch.chainId != null) next.chainId = patch.chainId;
  if (patch.txHash !== undefined) next.txHash = patch.txHash;
  if (patch.registry != null) next.registry = patch.registry;
  if (patch.tokenId != null || patch.chainId != null) {
    next.id = `${next.chainId}-${next.tokenId}`;
  }
  if (patch.job != null) next.job = patch.job;
  if (patch.pancake != null) next.pancake = patch.pancake;
  if (patch.liveReason != null) next.liveReason = patch.liveReason;
  if (patch.live !== undefined) next.liveLocked = true;
  if (patch.x402 != null) next.x402 = patch.x402;
  if (patch.protocols) next.protocols = patch.protocols;
  if (patch.totalScore != null) next.totalScore = patch.totalScore;
  if (patch.averageScore != null) next.averageScore = patch.averageScore;
  if (patch.feedbackCount != null) next.feedbackCount = patch.feedbackCount;
  if (patch.healthScore !== undefined) next.healthScore = patch.healthScore;
  if (patch.imageUrl !== undefined) next.imageUrl = patch.imageUrl;
  if (patch.feedback) {
    next.feedback = patch.feedback;
    if (patch.feedbackCount == null) next.feedbackCount = patch.feedback.length;
  }
  const metrics = { ...next.metrics };
  if (patch.winRate !== undefined) metrics.winRate = patch.winRate;
  if (patch.window !== undefined) metrics.window = patch.window;
  if (patch.maxDrawdown !== undefined) metrics.maxDrawdown = patch.maxDrawdown;
  if (patch.fills !== undefined) metrics.fills = patch.fills;
  if (patch.pnlPct !== undefined) metrics.pnlPct = patch.pnlPct;
  if (patch.risk !== undefined) metrics.risk = patch.risk;
  if (patch.venue !== undefined) metrics.venue = patch.venue;
  next.metrics = metrics;
  if (
    patch.spendCap != null ||
    patch.spendToken != null ||
    patch.expiryHours != null ||
    patch.allowlist != null ||
    patch.agentWallet !== undefined
  ) {
    next.policy = {
      wallet: patch.agentWallet ?? next.policy?.wallet ?? next.agentWallet ?? next.owner,
      allowlist: patch.allowlist ?? next.policy?.allowlist ?? getEffectiveAllowlist(),
      spendCap: patch.spendCap ?? next.policy?.spendCap ?? "0.05",
      spendToken: patch.spendToken ?? next.policy?.spendToken ?? "BNB",
      expiryHours: patch.expiryHours ?? next.policy?.expiryHours ?? 24,
    };
  }
  return next;
}
