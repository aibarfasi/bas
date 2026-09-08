import type { AltanaPolicy } from "@/lib/agents/types";

export type SessionState = "active" | "expired" | "revoked";

export type HiredSession = {
  id: string;
  agentId: string;
  agentName: string;
  chainId: number;
  tokenId: string;
  wallet: string;
  owner: string;
  allowlist: { label: string; address: string }[];
  spendCap: string;
  spendToken: string;
  expiry: number;
  createdAt: number;
  revokedAt: number | null;
  grantSig: string | null;
  revokeSig: string | null;
  grantTx: string | null;
  revokeTx: string | null;
  demo: boolean;
};

export function sessionState(s: HiredSession): SessionState {
  if (s.revokedAt) return "revoked";
  if (Date.now() / 1000 > s.expiry) return "expired";
  return "active";
}

export function buildSession(input: {
  agentId: string;
  agentName: string;
  chainId: number;
  tokenId: string;
  owner: string;
  policy: AltanaPolicy;
  grantSig?: string | null;
  demo: boolean;
}): HiredSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: `ses_${now}_${Math.random().toString(36).slice(2, 8)}`,
    agentId: input.agentId,
    agentName: input.agentName,
    chainId: input.chainId,
    tokenId: input.tokenId,
    wallet: input.policy.wallet,
    owner: input.owner,
    allowlist: input.policy.allowlist,
    spendCap: input.policy.spendCap,
    spendToken: input.policy.spendToken,
    expiry: now + input.policy.expiryHours * 3600,
    createdAt: now,
    revokedAt: null,
    grantSig: input.grantSig ?? null,
    revokeSig: null,
    grantTx: null,
    revokeTx: null,
    demo: input.demo,
  };
}

export const SESSION_TYPES = {
  Grant: [
    { name: "agentId", type: "string" },
    { name: "wallet", type: "address" },
    { name: "spendCap", type: "string" },
    { name: "spendToken", type: "string" },
    { name: "expiry", type: "uint256" },
    { name: "allowlistHash", type: "string" },
  ],
  Revoke: [
    { name: "sessionId", type: "string" },
    { name: "wallet", type: "address" },
  ],
} as const;

export function grantTypedData(chainId: number, session: HiredSession) {
  return {
    domain: {
      name: "BAS Altana Session",
      version: "1",
      chainId,
    },
    types: { Grant: SESSION_TYPES.Grant },
    primaryType: "Grant" as const,
    message: {
      agentId: session.agentId,
      wallet: session.wallet,
      spendCap: session.spendCap,
      spendToken: session.spendToken,
      expiry: BigInt(session.expiry),
      allowlistHash: session.allowlist.map((a) => a.address).join(","),
    },
  };
}
