import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import {
  addAllowlistItem,
  getEffectiveAllowlist,
  removeAllowlistItem,
} from "@/lib/admin/store";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ allowlist: getEffectiveAllowlist() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { label?: string; address?: string };
  if (!body.label || !body.address) {
    return NextResponse.json({ error: "label and address required" }, { status: 400 });
  }
  return NextResponse.json({ allowlist: addAllowlistItem({ label: body.label, address: body.address }) });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const address = new URL(req.url).searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  return NextResponse.json({ allowlist: removeAllowlistItem(address) });
}
