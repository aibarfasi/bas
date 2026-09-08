export type SessionReceipt = {
  id: string;
  action: "grant" | "revoke";
  sessionId: string;
  agentId: string;
  agentName: string;
  wallet: string;
  owner: string;
  spendCap: string;
  spendToken: string;
  expiry: number;
  allowlist: { label: string; address: string }[];
  grantSig: string | null;
  revokeSig: string | null;
  demo: boolean;
  explorer: string;
  createdAt: number;
};

const receipts = new Map<string, SessionReceipt>();

export function putReceipt(r: SessionReceipt) {
  receipts.set(r.id, r);
  return r;
}

export function getReceipt(id: string) {
  return receipts.get(id) ?? null;
}

export function listReceipts() {
  return [...receipts.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, 40);
}
