import { NextResponse } from "next/server";
import { publicAltanaReceipts, publicX402Receipts } from "@/lib/proofs/fixtures";

export const revalidate = 15;

export async function GET() {
  return NextResponse.json({
    altana: publicAltanaReceipts(),
    x402: publicX402Receipts(),
    note: "Live receipts from this runtime merge with committed fixtures. bag deploy adds KeyStore txs when the Studio CLI is funded.",
  });
}
