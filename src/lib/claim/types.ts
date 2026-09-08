export type SellerClaim = {
  id: string;
  agentId: string;
  chainId: number;
  tokenId: string;
  owner: string;
  sig: string;
  at: number;
  job?: string;
  pancake?: string;
  priceUsd?: number | null;
};
