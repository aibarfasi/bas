import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getSettings, listAudit } from "@/lib/admin/store";
import { getMarketplaceCatalog } from "@/lib/agents/scan";
import { listReceipts } from "@/lib/altana/ledger";
import { hireStats } from "@/lib/ops/hires";
import { listPayments } from "@/lib/x402/receipts";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { agents, totalOnBsc } = await getMarketplaceCatalog();
  const hires = hireStats();
  const settings = getSettings();
  const featured = agents.filter((a) => a.featured);
  const categories = {
    rebalance: agents.filter((a) => a.category === "rebalance").length,
    grid: agents.filter((a) => a.category === "grid").length,
    yield: agents.filter((a) => a.category === "yield").length,
    health: agents.filter((a) => a.category === "health").length,
    uncategorized: agents.filter((a) => a.category === "uncategorized").length,
  };
  const deployed = featured.filter((a) => {
    const map = settings.deployments[a.id];
    return Boolean(map?.tokenId || map?.txHash);
  }).length;
  return NextResponse.json({
    catalog: {
      totalOnBsc,
      listed: agents.length,
      featured: featured.length,
      hireable: agents.filter((a) => a.hireable).length,
      live: agents.filter((a) => a.live === true).length,
      uncategorized: categories.uncategorized,
      categories,
    },
    hires,
    receipts: listReceipts().length,
    payments: listPayments().length,
    settings,
    recent: listAudit().slice(0, 8),
    readiness: {
      intakeSubmitted: settings.intakeSubmitted,
      deployed,
      featured: featured.length,
      maintenance: settings.maintenance,
    },
  });
}
