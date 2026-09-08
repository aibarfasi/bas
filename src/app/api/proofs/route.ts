import { NextResponse } from "next/server";
import { hydrateFromSql } from "@/lib/admin/store";
import { publicAltanaReceipts, publicX402Receipts } from "@/lib/proofs/fixtures";
import { hydrateHires, listHireSessions } from "@/lib/ops/hires";

export const revalidate = 15;

export async function GET() {
  await hydrateFromSql();
  await hydrateHires();
  const disputed = listHireSessions().filter((s) => s.disputedAt);
  return NextResponse.json({
    altana: publicAltanaReceipts(),
    x402: publicX402Receipts(),
    disputes: disputed.map((s) => ({
      sessionId: s.id,
      agentName: s.agentName,
      reason: s.disputeReason,
      at: s.disputedAt,
      revokeHash: s.revokeHash,
    })),
    note: "Live receipts persist to disk and DATABASE_URL when set. Fixtures stay so the page is never empty. bag deploy adds KeyStore txs.",
  });
}
