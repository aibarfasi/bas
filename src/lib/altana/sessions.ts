import type { AltanaPolicy } from "@/lib/agents/types";

export type SessionState = "active" | "expired" | "revoked" | "disputed";

export type SessionEventKind =
  | "grant"
  | "pay"
  | "quote"
  | "allowlist"
  | "deliver"
  | "topup"
  | "renew"
  | "dispute"
  | "revoke"
  | "kill";

export type SessionEvent = {
  id: string;
  at: number;
  kind: SessionEventKind;
  label: string;
  detail: string;
  target?: string;
  ok: boolean;
};

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
  spent: string;
  expiry: number;
  createdAt: number;
  revokedAt: number | null;
  grantSig: string | null;
  revokeSig: string | null;
  grantTx: string | null;
  revokeTx: string | null;
  grantHash: string | null;
  revokeHash: string | null;
  ledgerId?: string | null;
  paymentId?: string | null;
  demo: boolean;
  events: SessionEvent[];
  renewCount: number;
  disputedAt: number | null;
  disputeReason: string | null;
};

export function sessionState(s: HiredSession): SessionState {
  if (s.disputedAt) return "disputed";
  if (s.revokedAt) return "revoked";
  if (Date.now() / 1000 > s.expiry) return "expired";
  return "active";
}

export function remainingCap(s: HiredSession) {
  const cap = Number(s.spendCap);
  const spent = Number(s.spent ?? "0");
  if (!Number.isFinite(cap) || !Number.isFinite(spent)) return s.spendCap;
  return Math.max(0, cap - spent).toString();
}

export function makeEvent(
  kind: SessionEventKind,
  label: string,
  detail: string,
  extra?: { target?: string; ok?: boolean },
): SessionEvent {
  return {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    kind,
    label,
    detail,
    target: extra?.target,
    ok: extra?.ok ?? true,
  };
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
    spent: "0",
    expiry: now + input.policy.expiryHours * 3600,
    createdAt: now,
    revokedAt: null,
    grantSig: input.grantSig ?? null,
    revokeSig: null,
    grantTx: null,
    revokeTx: null,
    grantHash: null,
    revokeHash: null,
    ledgerId: null,
    paymentId: null,
    demo: input.demo,
    events: [],
    renewCount: 0,
    disputedAt: null,
    disputeReason: null,
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

export function normalizeSession(s: HiredSession): HiredSession {
  return {
    ...s,
    spent: s.spent ?? "0",
    grantHash: s.grantHash ?? null,
    revokeHash: s.revokeHash ?? null,
    events: s.events ?? [],
    renewCount: s.renewCount ?? 0,
    disputedAt: s.disputedAt ?? null,
    disputeReason: s.disputeReason ?? null,
    grantTx: s.grantTx ?? null,
    revokeTx: s.revokeTx ?? null,
  };
}
