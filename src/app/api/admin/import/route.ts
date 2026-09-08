import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { importSnapshot } from "@/lib/admin/store";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON snapshot required" }, { status: 400 });
  }
  return NextResponse.json(importSnapshot(body));
}
