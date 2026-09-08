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
};

const receipts = new Map<string, X402Receipt>();

export function putPayment(r: X402Receipt) {
  receipts.set(r.id, r);
  return r;
}

export function getPayment(id: string) {
  return receipts.get(id) ?? null;
}

export function listPayments() {
  return [...receipts.values()].sort((a, b) => b.paidAt - a.paidAt).slice(0, 80);
}
