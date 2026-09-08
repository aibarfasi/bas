import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getSettings, hydrateFromSql, updateSettings } from "@/lib/admin/store";
import type { SiteSettings } from "@/lib/admin/types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await hydrateFromSql();
  return NextResponse.json({ settings: getSettings() });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Partial<SiteSettings>;
  return NextResponse.json({ settings: updateSettings(body) });
}
