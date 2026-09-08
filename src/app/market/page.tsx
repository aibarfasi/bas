import { MarketView } from "@/components/market/MarketView";
import { AppShell } from "@/components/shell/AppShell";
import { normalizeCat } from "@/lib/categories";
import { getMarketplaceCatalog } from "@/lib/agents/scan";

export const revalidate = 60;

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const initial = normalizeCat(cat);
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
