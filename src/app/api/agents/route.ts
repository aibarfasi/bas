import { getMarketplaceCatalog } from "@/lib/agents/scan";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  const { agents, totalOnBsc } = await getMarketplaceCatalog();
  const live = agents.filter((a) => a.live === true).length;
  const featured = agents.filter((a) => a.featured).length;
  const uncategorized = agents.filter((a) => a.category === "uncategorized").length;
  return NextResponse.json({
    agents,
    stats: {
      scanned: agents.length,
      featured,
      live,
      uncategorized,
      totalOnBsc,
    },
    fetchedAt: new Date().toISOString(),
  });
}
