import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getMarketplaceCatalog } from "@/lib/agents/scan";
import { getOverrides, getSettings, putOverride, putOverrides } from "@/lib/admin/store";
import type { AgentPatch } from "@/lib/admin/types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { agents, totalOnBsc } = await getMarketplaceCatalog();
  return NextResponse.json({
    agents,
    totalOnBsc,
    overrides: getOverrides(),
    trendingIds: getSettings().trendingIds,
  });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as AgentPatch & { ids?: string[] };
  if (body.ids?.length) {
    const { ids, ...fields } = body;
    putOverrides(ids.map((id) => ({ ...fields, id })));
    return NextResponse.json({ ok: true, count: ids.length });
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const override = putOverride(body);
  return NextResponse.json({ override });
}
