import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { listReceipts } from "@/lib/altana/ledger";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ receipts: listReceipts() });
}
