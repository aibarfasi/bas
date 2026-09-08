import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveFeaturedAgents } from "@/lib/admin/catalog";
import { getOverrides, getSettings } from "@/lib/admin/store";
import { hireStats } from "@/lib/ops/hires";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const featured = resolveFeaturedAgents();
  const settings = getSettings();
  const hidden = Object.values(getOverrides()).filter((o) => o.hidden).length;
  return NextResponse.json({
    sellers: featured.length,
    hireable: featured.filter((a) => a.hireable).length,
    hidden,
    hires: hireStats(),
    maintenance: settings.maintenance,
    notice: Boolean(settings.notice),
    intakeSubmitted: settings.intakeSubmitted,
  });
}
