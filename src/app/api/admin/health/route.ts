import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getScanStats } from "@/lib/agents/scan";
import { listReceipts } from "@/lib/altana/ledger";
import { quotePancakeSwap } from "@/lib/pancake/quote";
import { listPayments } from "@/lib/x402/receipts";

type Check = { id: string; ok: boolean; detail: string; ms: number };

async function timed(id: string, fn: () => Promise<string>): Promise<Check> {
  const started = Date.now();
  try {
    const detail = await fn();
    return { id, ok: true, detail, ms: Date.now() - started };
  } catch (e) {
    return {
      id,
      ok: false,
      detail: e instanceof Error ? e.message : "Failed",
      ms: Date.now() - started,
    };
  }
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const origin = new URL(req.url).origin;
  const kinds = ["rebalance", "grid", "yield", "health", "equities"];

  const checks = await Promise.all([
    timed("8004scan", async () => {
      const stats = await getScanStats();
      if (!stats) throw new Error("8004scan stats unavailable");
      return `${stats.total_agents ?? "?"} agents indexed`;
    }),
    timed("pancake", async () => {
      const quote = await quotePancakeSwap({ amountIn: "0.05", side: "sell-bnb" });
      if (!Number(quote.minOut)) throw new Error("minOut is 0");
      return `${quote.pair} minOut ${quote.minOut}`;
    }),
    timed("altana", async () => `${listReceipts().length} receipts in memory`),
    timed("x402", async () => `${listPayments().length} payments in memory`),
    ...kinds.map((kind) =>
      timed(`face:${kind}`, async () => {
        const a2a = await fetch(`${origin}/api/hire/faces/${kind}/a2a`);
        if (!a2a.ok) throw new Error(`A2A ${a2a.status}`);
        const x402 = await fetch(`${origin}/api/hire/faces/${kind}/x402`);
        if (x402.status !== 402) throw new Error(`x402 expected 402, got ${x402.status}`);
        return "A2A 200 · x402 402";
      }),
    ),
  ]);

  return NextResponse.json({
    ok: checks.every((c) => c.ok),
    checkedAt: new Date().toISOString(),
    checks,
  });
}
