import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { listPayments } from "@/lib/x402/receipts";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ payments: listPayments() });
}
