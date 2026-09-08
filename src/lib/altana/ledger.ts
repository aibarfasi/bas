import {
  getAltanaReceipt,
  listAltanaReceipts,
  putAltanaReceipt,
} from "@/lib/admin/store";

export type SessionReceipt = {
  id: string;
  action: "grant" | "revoke" | "renew" | "topup" | "dispute";
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
  grantHash?: string | null;
  revokeHash?: string | null;
  grantTx?: string | null;
  revokeTx?: string | null;
  demo: boolean;
  explorer: string;
  createdAt: number;
};

export function putReceipt(r: SessionReceipt) {
  return putAltanaReceipt(r);
}

export function getReceipt(id: string) {
  return getAltanaReceipt(id);
}

export function listReceipts() {
  return listAltanaReceipts();
}
