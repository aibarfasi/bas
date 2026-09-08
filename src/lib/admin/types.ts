import type { Category, MarketplaceAgent } from "@/lib/agents/types";
import type { HiredSession } from "@/lib/altana/sessions";
import type { HireJob } from "@/lib/hire/types";

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
};
