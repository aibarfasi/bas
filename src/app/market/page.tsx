import { MarketView } from "@/components/market/MarketView";
import { AppShell } from "@/components/shell/AppShell";
import type { CategoryFilter } from "@/lib/agents/types";
import { getMarketplaceCatalog } from "@/lib/agents/scan";

export const revalidate = 60;

const CATS = new Set(["all", "rebalance", "grid", "yield", "health"]);

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const initial = CATS.has(cat ?? "") ? (cat as CategoryFilter) : "all";
  const { agents, totalOnBsc } = await getMarketplaceCatalog();
  const featured = agents.filter((a) => a.featured).length;
  const live = agents.filter((a) => a.live === true).length;
  const uncategorized = agents.filter((a) => a.category === "uncategorized").length;

  return (
    <AppShell>
      <MarketView
        initialCat={initial}
        data={{
          agents,
          stats: {
            scanned: agents.length,
            featured,
            live,
            uncategorized,
            totalOnBsc,
          },
          fetchedAt: new Date().toISOString(),
        }}
      />
    </AppShell>
  );
}
