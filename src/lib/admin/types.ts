import type { AgentFeedback, Category, MarketplaceAgent } from "@/lib/agents/types";
import type { HiredSession } from "@/lib/altana/sessions";
import type { SessionReceipt } from "@/lib/altana/ledger";
import type { HireJob } from "@/lib/hire/types";
import type { SellerClaim } from "@/lib/claim/types";
import type { X402Receipt } from "@/lib/x402/receipts";

export type AgentPatch = {
  id: string;
  hidden?: boolean;
  featured?: boolean;
  hireable?: boolean;
  live?: boolean | null;
  verified?: boolean;
  category?: Category;
  categoryReason?: string;
  name?: string;
  description?: string;
  priceUsd?: number | null;
  owner?: string;
  agentWallet?: string | null;
  tokenId?: string;
  chainId?: number;
  txHash?: string | null;
  registry?: string;
  spendCap?: string;
  spendToken?: string;
  expiryHours?: number;
  allowlist?: { label: string; address: string }[];
  notes?: string;
  job?: string;
  pancake?: string;
  liveReason?: string;
  x402?: boolean;
  protocols?: string[];
  totalScore?: number;
  averageScore?: number;
  feedbackCount?: number;
  healthScore?: number | null;
  imageUrl?: string | null;
  winRate?: number | null;
  window?: string | null;
  maxDrawdown?: number | null;
  fills?: number | null;
  pnlPct?: number | null;
  risk?: string | null;
  venue?: string | null;
  feedback?: AgentFeedback[];
};

export type DeployMap = {
  tokenId?: string;
  chainId?: number;
  txHash?: string | null;
  grantTx?: string | null;
  revokeTx?: string | null;
};

export type SiteSettings = {
  prizeWallet: string;
  intakeUrl: string;
  liveUrl: string;
  repoUrl: string;
  notice: string;
  maintenance: boolean;
  hideUncategorized: boolean;
  intakeSubmitted: boolean;
  deployments: Record<string, DeployMap>;
  trendingIds: string[];
};

export type AllowlistItem = { label: string; address: string };

export type AuditEvent = {
  id: string;
  at: number;
  action: string;
  detail: string;
};

export type AdminState = {
  overrides: Record<string, AgentPatch>;
  custom: MarketplaceAgent[];
  settings: SiteSettings;
  allowlist: AllowlistItem[];
  audit: AuditEvent[];
  sessions: HiredSession[];
  jobs: HireJob[];
  altanaReceipts: SessionReceipt[];
  x402Receipts: X402Receipt[];
  claims: SellerClaim[];
};

export type AgentDraft = {
  name: string;
  description: string;
  category: Category;
  tokenId: string;
  chainId: number;
  owner: string;
  agentWallet: string;
  priceUsd: number;
  featured: boolean;
  hireable: boolean;
  live: boolean;
  verified: boolean;
  spendCap: string;
  spendToken: string;
  expiryHours: number;
  txHash: string;
  registry: string;
  categoryReason: string;
  notes: string;
  job: string;
  pancake: string;
  liveReason: string;
  x402: boolean;
  protocols: string;
  totalScore: number;
  averageScore: number;
  feedbackCount: number;
  healthScore: string;
  winRate: string;
  window: string;
  maxDrawdown: string;
  fills: string;
  pnlPct: string;
  risk: string;
  venue: string;
  feedback: AgentFeedback[];
};
