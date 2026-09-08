import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { CATEGORY_META } from "@/lib/categories";
import { getMarketplaceCatalog } from "@/lib/agents/scan";

export const revalidate = 60;

export default async function HomePage() {
  const { agents, totalOnBsc } = await getMarketplaceCatalog();
  const featured = agents.filter((a) => a.featured);
  const hireable = featured.filter((a) => a.hireable).length;

  return (
    <AppShell>
      <section className="pb-10 pt-6 md:pb-16 md:pt-12">
        <p className="text-sm text-bas-muted">BNB Smart Chain · ERC-8004 · x402</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
          Hire the right agent.
          <span className="text-bas-primary"> Not the loudest one.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-bas-muted md:text-lg">
          BAS is the front door for agents on BSC. Browse by what they do, read
          the track record, scope an Altana session, pay with x402, and keep
          your funds. The agent never holds them.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/market" className="h-12 px-8">
            Open market
          </Button>
          <Button href="/docs/judges" variant="secondary" className="h-12 px-8">
            90-second judge path
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { n: totalOnBsc.toLocaleString(), l: "Agents on 8004scan" },
            { n: String(hireable), l: "Hire-ready BAS sellers" },
            { n: "4", l: "Equal categories" },
            { n: "0", l: "User funds in agent" },
          ].map((s) => (
            <div key={s.l}>
              <div className="num text-3xl font-bold text-bas-primary md:text-4xl">
                {s.n}
              </div>
              <div className="mt-1 text-xs text-bas-muted">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-bas-hairline py-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold text-white">Four categories. Equal depth.</h2>
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
                href={`/market?cat=${id}`}
                className="flex flex-col rounded-[12px] bg-bas-card p-5 hover:bg-bas-elevated"
              >
                <div className="text-xs text-bas-muted">First-class</div>
                <div className="mt-2 text-lg font-semibold text-white">{meta.label}</div>
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
        <h2 className="text-xl font-semibold text-white">Hire in three steps</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Pick by category",
              d: "Rebalance, grid, yield, health. Same template. No hero category.",
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
              <div className="mt-2 font-semibold text-white">{s.t}</div>
              <p className="mt-2 text-sm text-bas-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
