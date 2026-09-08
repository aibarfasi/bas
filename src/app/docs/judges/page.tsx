import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { BRIEF_COMPARE_HREF } from "@/lib/compare/sellers";

export default function JudgesPage() {
  return (
    <AppShell>
      <p className="text-xs text-bas-muted">Submission · ~90 seconds</p>
      <h1 className="mt-2 text-3xl font-semibold text-bas-heading">Judge path</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-bas-muted">
        The product is the venue. Find an ERC-8004 agent, read the record, hire
        it. Demo is enough — no wallet, no invented txs.
      </p>

      <ol className="mt-8 space-y-4">
        {[
          {
            n: "1",
            t: "Land",
            d: "BNB Agent Studio marketplace. Four equal categories from the brief: Monitoring, Grid trading, Health factor, Yield.",
            href: "/",
            cta: "Home",
          },
          {
            n: "2",
            t: "Find",
            d: "Market filtered to Monitoring. BAS Range Guard is the hire-ready seller. Uncategorized 8004scan records stay visible.",
            href: "/market?cat=monitoring",
            cta: "Monitoring market",
          },
          {
            n: "3",
            t: "Understand",
            d: "Open Range Guard. Job, win rate, Pancake venue, Altana cap and allowlist, 8004scan identity.",
            href: "/agent/97/bas-rebalance",
            cta: "Agent",
          },
          {
            n: "4",
            t: "Compare",
            d: "Four BAS sellers side by side — Monitoring, Grid, Health, Yield. Hire from the table.",
            href: BRIEF_COMPARE_HREF,
            cta: "Compare",
          },
          {
            n: "5",
            t: "Hire + revoke",
            d: "Continue as demo. Scope cap → pay x402 → land on /session/[id]. Revoke there. Receipts write to /proofs.",
            href: "/hire/97-bas-rebalance",
            cta: "Hire Range Guard",
          },
          {
            n: "6",
            t: "Public proofs",
            d: "Altana grant/revoke and x402 receipts. No admin. Fixtures stay if serverless memory reset.",
            href: "/proofs",
            cta: "Proofs",
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
        <h2 className="font-semibold text-bas-heading">If you have one more minute</h2>
        <p className="mt-2">
          <a href="/advantage" className="text-bas-primary">
            /advantage
          </a>{" "}
          is the TermiX report: Monitoring, trade, health, yield, plus an equities swing book. JSON
          attachments download from each card.
        </p>
      </section>

      <section className="mt-4 rounded-[12px] bg-bas-card p-5 text-sm text-bas-muted">
        <h2 className="font-semibold text-bas-heading">Tracks ticked</h2>
        <ul className="mt-3 space-y-1">
          <li>Main — discover, compare, hire. Four brief categories, equal template.</li>
          <li>TermiX — /advantage with hire CTAs on the live site.</li>
          <li>AltLayer / Altana — cap, allowlist, expiry, revoke, public /proofs + explorer wallets.</li>
          <li>PancakeSwap — Smart Router / NFPM, recipient = you, minOut ≠ 0. Agent never holds funds.</li>
        </ul>
      </section>
    </AppShell>
  );
}
