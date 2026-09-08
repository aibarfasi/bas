import { listX402Receipts, putX402Receipt } from "@/lib/admin/store";

export type X402Receipt = {
  id: string;
  kind: string;
  network: "bsc-testnet";
  facilitator: "Binance x402 / B402";
  scheme: "exact";
  asset: "USDT";
  amountUsd: number;
  payment: string;
  recipient: string;
  paidAt: number;
  demo: boolean;
  settled?: boolean;
  resource?: string | null;
};

export function putPayment(r: X402Receipt) {
  return putX402Receipt(r);
}

export function getPayment(id: string) {
  return listX402Receipts().find((x) => x.id === id) ?? null;
}

export function listPayments() {
  return listX402Receipts();
}
