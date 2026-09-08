import type { SessionReceipt } from "@/lib/altana/ledger";
import { listReceipts } from "@/lib/altana/ledger";
import { altanaExplorer } from "@/lib/format";
import type { X402Receipt } from "@/lib/x402/receipts";
import { listPayments } from "@/lib/x402/receipts";

const WALLET = "0x5b2B3c4D5e6F708192A3b4C5d6E7f8091A2b3C4D";
const OWNER = "0x7bA5D3e4F1c2A90d8E6C4B3A1F9D2E8C7A6B5D4E";

export const FIXTURE_ALTANA: SessionReceipt[] = [
  {
    id: "alt_grant_fixture_grid",
    action: "grant",
    sessionId: "ses_fixture_grid",
    agentId: "97-bas-grid",
    agentName: "BAS Grid Pilot",
    wallet: WALLET,
    owner: OWNER,
    spendCap: "0.05",
    spendToken: "BNB",
    expiry: 1_778_284_800,
    allowlist: [{ label: "Pancake Smart Router", address: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4" }],
    grantSig: null,
    revokeSig: null,
    demo: true,
    explorer: altanaExplorer(WALLET),
    createdAt: 1_757_280_000_000,
  },
  {
    id: "alt_revoke_fixture_grid",
    action: "revoke",
    sessionId: "ses_fixture_grid",
    agentId: "97-bas-grid",
    agentName: "BAS Grid Pilot",
    wallet: WALLET,
    owner: OWNER,
    spendCap: "0.05",
    spendToken: "BNB",
    expiry: 1_778_284_800,
    allowlist: [{ label: "Pancake Smart Router", address: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4" }],
    grantSig: null,
    revokeSig: null,
    demo: true,
    explorer: altanaExplorer(WALLET),
    createdAt: 1_757_283_600_000,
  },
];

export const FIXTURE_X402: X402Receipt[] = [
  {
    id: "x402_grid_fixture",
    kind: "grid",
    network: "bsc-testnet",
    facilitator: "Binance x402 / B402",
    scheme: "exact",
    asset: "USDT",
    amountUsd: 0.15,
    payment: "demo",
    recipient: "hirer (demo)",
    paidAt: 1_757_280_000_000,
    demo: true,
  },
  {
    id: "x402_health_fixture",
    kind: "health",
    network: "bsc-testnet",
    facilitator: "Binance x402 / B402",
    scheme: "exact",
    asset: "USDT",
    amountUsd: 0.1,
    payment: "demo",
    recipient: "hirer (demo)",
    paidAt: 1_757_280_100_000,
    demo: true,
  },
];

export function publicAltanaReceipts() {
  const live = listReceipts();
  const ids = new Set(live.map((r) => r.id));
  return [...live, ...FIXTURE_ALTANA.filter((r) => !ids.has(r.id))].slice(0, 40);
}

export function publicX402Receipts() {
  const live = listPayments();
  const ids = new Set(live.map((r) => r.id));
  return [...live, ...FIXTURE_X402.filter((r) => !ids.has(r.id))].slice(0, 80);
}
