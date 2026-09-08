import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";

export default function JudgesPage() {
  return (
    <AppShell>
      <p className="text-xs text-bas-muted">Submission · 90 seconds</p>
      <h1 className="mt-2 text-3xl font-semibold text-bas-heading">Judge path</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-bas-muted">
        Someone with zero Agent Studio knowledge should finish this without a
        dead end. Phone or desktop.
      </p>

      <ol className="mt-8 space-y-4">
        {[
          {
            n: "1",
            t: "Land",
            d: "Home states the product. Four equal categories: Monitoring, Grid, Yield, Health. Stats come from 8004scan.",
            href: "/",
            cta: "Home",
          },
          {
            n: "2",
            t: "Find by category",
            d: "Open Market. Use the four filters (Monitoring = Range Guard). Uncategorized stays visible.",
            href: "/market?cat=grid",
            cta: "Grid market",
          },
          {
            n: "3",
            t: "Understand",
            d: "Open BAS Grid Pilot. Read win rate, window, risk, Pancake venue, Altana policy.",
            href: "/agent/97/bas-grid",
            cta: "Agent",
          },
          {
            n: "4",
            t: "Compare",
            d: "Add two BAS sellers, open Compare, hire from the table.",
            href: "/compare",
            cta: "Compare",
          },
          {
            n: "5",
            t: "Activate",
            d: "Hire → scope session → pay x402 → deliverable. Continue as demo if you have no wallet.",
            href: "/hire/97-bas-grid",
            cta: "Hire Grid Pilot",
          },
          {
            n: "6",
            t: "Revoke",
            d: "Session page shows cap, expiry countdown, allowlist, Revoke. That is the Altana surface.",
            href: "/market",
            cta: "After hire",
          },
          {
            n: "7",
            t: "TermiX proof",
            d: "Advantage report: trade, security, yield, and equities. Time / cost / quality.",
            href: "/advantage",
            cta: "Report",
          },
        ].map((s) => (
          <li
            key={s.n}
            className="flex flex-col gap-3 rounded-[12px] bg-bas-card p-5 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="num text-bas-primary">{s.n}</div>
              <div className="mt-1 font-semibold text-bas-heading">{s.t}</div>
              <p className="mt-1 text-sm text-bas-muted">{s.d}</p>
            </div>
            <Button href={s.href} className="shrink-0">
              {s.cta}
            </Button>
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-[12px] bg-bas-card p-5 text-sm text-bas-muted">
        <h2 className="font-semibold text-bas-heading">Tracks ticked</h2>
        <ul className="mt-3 space-y-1">
          <li>Main — discover, compare, hire. Monitoring, grid, yield, health.</li>
          <li>TermiX — /advantage: trade, security, yield, equities.</li>
          <li>Altana — cap, allowlist, expiry, revoke, public receipt + explorer.</li>
          <li>PancakeSwap — Smart Router / NFPM, recipient = you, minOut ≠ 0.</li>
        </ul>
      </section>
    </AppShell>
  );
}
