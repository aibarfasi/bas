export const CATEGORIES = [
  "rebalance",
  "grid",
  "yield",
  "health",
  "uncategorized",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type CategoryFilter = Exclude<Category, "uncategorized"> | "all";

export type AgentService = {
  name: "a2a" | "mcp" | "x402" | "web";
  endpoint?: string | null;
  version?: string | null;
};

export type AgentFeedback = {
  client: string;
  score: number;
  tag: string;
  comment: string;
  at: string;
};

export type AgentMetrics = {
  winRate: number | null;
  window: string | null;
  maxDrawdown: number | null;
  fills: number | null;
  pnlPct: number | null;
  risk: string | null;
  venue: string | null;
};

export type AltanaPolicy = {
  wallet: string;
  allowlist: { label: string; address: string }[];
  spendCap: string;
  spendToken: string;
  expiryHours: number;
};

export type MarketplaceAgent = {
  id: string;
  tokenId: string;
  chainId: number;
  registry: string;
  name: string;
  description: string;
  owner: string;
  agentWallet: string | null;
  category: Category;
  categoryReason: string;
  featured: boolean;
  hireable: boolean;
  live: boolean | null;
  liveReason: string;
  x402: boolean;
  protocols: string[];
  services: AgentService[];
  totalScore: number;
  averageScore: number;
  feedbackCount: number;
  healthScore: number | null;
  verified: boolean;
  createdAt: string;
  txHash: string | null;
  imageUrl: string | null;
  metrics: AgentMetrics;
  policy: AltanaPolicy | null;
  priceUsd: number | null;
  feedback: AgentFeedback[];
  source: "featured" | "8004scan";
  filteredReason?: string;
  job?: string;
  pancake?: string;
  liveLocked?: boolean;
};

export type AgentsResponse = {
  agents: MarketplaceAgent[];
  stats: {
    scanned: number;
    featured: number;
    live: number;
    uncategorized: number;
    totalOnBsc: number;
  };
  fetchedAt: string;
};
