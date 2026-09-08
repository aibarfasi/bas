import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { exportSnapshot } from "@/lib/admin/store";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(exportSnapshot());
}
