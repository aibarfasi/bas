import Link from "next/link";
import { TrendingBento } from "@/components/home/TrendingBento";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { CATEGORY_META } from "@/lib/categories";
import { catalogTrendingIds, getMarketplaceCatalog } from "@/lib/agents/scan";
import { pickTrendingAgents } from "@/lib/agents/trending";

export const revalidate = 15;

export default async function HomePage() {
  const { agents } = await getMarketplaceCatalog();
  const featured = agents.filter((a) => a.featured);
  const trending = pickTrendingAgents(agents, catalogTrendingIds());

  return (
    <AppShell>
      <section className="pb-10 pt-6 md:pb-16 md:pt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(400px,560px)] lg:items-start">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-bas-heading md:text-6xl">
              The BNB Agent Studio marketplace.
              <span className="text-bas-primary"> Hire the right agent.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-bas-muted md:text-lg">
              200k+ agents are registered on BSC under ERC-8004. There is no good way
              to find them. BAS is the venue: browse by what they do, read the track
              record, compare, hire. x402 to pay. Altana to scope and revoke. The
              agent never holds your funds.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/market" className="h-12 px-8">
                Open market
              </Button>
              <Button href="/docs/judges" variant="secondary" className="h-12 px-8">
                90-second judge path
              </Button>
            </div>
          </div>
          <TrendingBento agents={trending} />
        </div>
      </section>

      <section className="border-t border-bas-hairline py-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold text-bas-heading">Four categories. Equal depth.</h2>
          <Link href="/market" className="text-sm text-bas-primary">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(
            Object.entries(CATEGORY_META) as [
              keyof typeof CATEGORY_META,
              (typeof CATEGORY_META)[keyof typeof CATEGORY_META],
            ][]
          ).map(([id, meta]) => {
            const agent = featured.find((a) => a.category === id);
            return (
              <Link
                key={id}
                href={`/market?cat=${id === "rebalance" ? "monitoring" : id}`}
                className="flex flex-col rounded-[12px] bg-bas-card p-5 hover:bg-bas-elevated"
              >
                <div className="text-xs text-bas-muted">First-class</div>
                <div className="mt-2 text-lg font-semibold text-bas-heading">{meta.label}</div>
                <p className="mt-2 flex-1 text-sm leading-6 text-bas-muted">{meta.job}</p>
                <p className="mt-3 text-xs text-bas-body">{meta.pancake}</p>
                {agent ? (
                  <div className="mt-4 text-xs text-bas-primary">Hire {agent.name} →</div>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-bas-hairline py-10">
        <h2 className="text-xl font-semibold text-bas-heading">Hire in three steps</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Pick by category",
              d: "Monitoring, grid trading, health factor, yield. Same template. No hero category.",
            },
            {
              n: "02",
              t: "Scope an Altana session",
              d: "Allowlist, spend cap, expiry. Revoke is one click and onchain-shaped.",
            },
            {
              n: "03",
              t: "Pay and keep custody",
              d: "x402 / ERC-8183. Pancake fills deliver to your address. minOut is never 0.",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-[12px] bg-bas-card p-5">
              <div className="num text-bas-primary">{s.n}</div>
              <div className="mt-2 font-semibold text-bas-heading">{s.t}</div>
              <p className="mt-2 text-sm text-bas-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
