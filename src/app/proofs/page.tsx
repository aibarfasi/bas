import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { hydrateFromSql } from "@/lib/admin/store";
import { publicAltanaReceipts, publicX402Receipts } from "@/lib/proofs/fixtures";
import { hydrateHires, listHireSessions } from "@/lib/ops/hires";
import { shortAddr, timeAgo } from "@/lib/format";

export const revalidate = 15;

export default async function ProofsPage() {
  await hydrateFromSql();
  await hydrateHires();
  const altana = publicAltanaReceipts();
  const x402 = publicX402Receipts();
  const disputes = listHireSessions().filter((s) => s.disputedAt);

  return (
    <AppShell>
      <p className="text-xs text-bas-muted">Public ledger · Altana · x402</p>
      <h1 className="mt-2 text-3xl font-semibold text-bas-heading">Proofs</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-bas-muted">
        Grant, revoke, renew, top-up, dispute, and x402 receipts from this runtime, plus
        committed fixtures so the page is never empty. Set <span className="num">DATABASE_URL</span> to
        keep them across serverless cold starts. Wallet links open the Altana explorer. Real
        KeyStore txs appear after <span className="num">bag deploy</span>.
      </p>
      <p className="mt-2 text-xs text-bas-muted">
        Hire Range Guard to mint a live receipt this session.{" "}
        <Link href="/hire/97-bas-rebalance" className="text-bas-primary">
          Hire now
        </Link>
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-bas-heading">Altana sessions ({altana.length})</h2>
        <ul className="mt-3 divide-y divide-bas-hairline rounded-[12px] bg-bas-card">
          {altana.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-bas-heading">
                  {r.action} · {r.agentName}
                </div>
                <div className="num mt-1 text-xs text-bas-muted">
                  {r.spendCap} {r.spendToken} · {r.demo ? "demo" : "signed"} · {timeAgo(new Date(r.createdAt).toISOString())}
                  {r.grantHash ? ` · ${shortAddr(r.grantHash, 4)}` : ""}
                </div>
              </div>
              <a href={r.explorer} target="_blank" rel="noreferrer" className="num text-sm text-bas-primary">
                {shortAddr(r.wallet)}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-bas-heading">x402 payments ({x402.length})</h2>
        <ul className="mt-3 divide-y divide-bas-hairline rounded-[12px] bg-bas-card">
          {x402.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-bas-heading">
                  {r.kind} · ${r.amountUsd.toFixed(2)} {r.asset}
                </div>
                <div className="num mt-1 text-xs text-bas-muted">
                  {r.facilitator} · {r.demo ? "demo" : r.settled ? "settled" : "signed"} · {timeAgo(new Date(r.paidAt).toISOString())}
                </div>
              </div>
              <span className="num text-xs text-bas-muted">{r.id}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-bas-heading">Disputes / kill switch ({disputes.length})</h2>
        {disputes.length ? (
          <ul className="mt-3 divide-y divide-bas-hairline rounded-[12px] bg-bas-card">
            {disputes.map((s) => (
              <li key={s.id} className="p-4">
                <div className="text-sm text-bas-heading">{s.agentName}</div>
                <div className="mt-1 text-sm text-bas-muted">{s.disputeReason}</div>
                <Link href={`/session/${s.id}`} className="num mt-1 inline-block text-xs text-bas-primary">
                  {s.id}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-bas-muted">
            No disputes yet. From an active session, Dispute & kill publishes a public event and pulls authority.
          </p>
        )}
      </section>
    </AppShell>
  );
}

