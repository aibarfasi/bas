"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, ResponsiveTable, SearchField, Skeleton, StatusBanner } from "@/components/admin/ResponsiveTable";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import type { SessionReceipt } from "@/lib/altana/ledger";
import type { X402Receipt } from "@/lib/x402/receipts";
import { shortAddr, timeAgo } from "@/lib/format";

type Tab = "altana" | "x402";
type ActionFilter = "all" | SessionReceipt["action"];

function atMs(n: number) {
  return n < 1e12 ? n * 1000 : n;
}

function ago(n: number) {
  return timeAgo(new Date(atMs(n)).toISOString());
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function Mark({ name }: { name: string }) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-bas-elevated text-[11px] font-semibold text-bas-heading">
      {initials(name)}
    </span>
  );
}

function ActionBadge({ action }: { action: SessionReceipt["action"] }) {
  const cls =
    action === "grant" || action === "renew" || action === "topup"
      ? "border-bas-up/40 bg-bas-up/10 text-bas-up"
      : "border-bas-down/40 bg-bas-down/10 text-bas-down";
  return (
    <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs capitalize ${cls}`}>
      {action}
    </span>
  );
}

function KindBadge({ kind }: { kind: string }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-bas-hairline px-2.5 text-xs">
      {kind}
    </span>
  );
}

export default function AdminProofsPage() {
  const [tab, setTab] = useState<Tab>("altana");
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [receipts, setReceipts] = useState<SessionReceipt[]>([]);
  const [payments, setPayments] = useState<X402Receipt[]>([]);
  const [open, setOpen] = useState<SessionReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetch<{ receipts: SessionReceipt[] }>("/api/admin/receipts"),
      adminFetch<{ payments: X402Receipt[] }>("/api/admin/payments"),
    ])
      .then(([r, p]) => {
        setReceipts(r.receipts);
        setPayments(p.payments);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  const actionCounts = useMemo(() => {
    const by = { all: receipts.length, grant: 0, revoke: 0, renew: 0, topup: 0, dispute: 0 };
    for (const r of receipts) by[r.action] += 1;
    return by;
  }, [receipts]);

  const kindCounts = useMemo(() => {
    const by: Record<string, number> = { all: payments.length };
    for (const p of payments) by[p.kind] = (by[p.kind] ?? 0) + 1;
    return by;
  }, [payments]);

  const volume = useMemo(() => payments.reduce((n, p) => n + (p.amountUsd || 0), 0), [payments]);
  const demoReceipts = receipts.filter((r) => r.demo).length;
  const settled = payments.filter((p) => p.settled).length;

  const shownReceipts = useMemo(() => {
    const n = q.trim().toLowerCase();
    return receipts.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (!n) return true;
      return `${r.agentName} ${r.id} ${r.wallet} ${r.owner} ${r.action} ${r.sessionId}`.toLowerCase().includes(n);
    });
  }, [receipts, q, actionFilter]);

  const shownPayments = useMemo(() => {
    const n = q.trim().toLowerCase();
    return payments.filter((p) => {
      if (kindFilter !== "all" && p.kind !== kindFilter) return false;
      if (!n) return true;
      return `${p.id} ${p.kind} ${p.recipient} ${p.facilitator} ${p.asset}`.toLowerCase().includes(n);
    });
  }, [payments, q, kindFilter]);

  const actionFilters: { id: ActionFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "grant", label: "Grant" },
    { id: "revoke", label: "Revoke" },
    { id: "renew", label: "Renew" },
    { id: "topup", label: "Top-up" },
    { id: "dispute", label: "Dispute" },
  ];

  const kindFilters = ["all", ...Object.keys(kindCounts).filter((k) => k !== "all")];

  return (
    <div>
      <PageHeader
        title="Proofs"
        desc="Public Altana receipts and x402 payment records from this runtime. In-memory on Vercel unless DATABASE_URL is set."
        actions={
          <>
            <Button href="/proofs" variant="secondary">
              Public proofs
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  tab === "altana" ? "bas-altana.csv" : "bas-x402.csv",
                  tab === "altana"
                    ? shownReceipts.map((r) => ({
                        id: r.id,
                        action: r.action,
                        agent: r.agentName,
                        wallet: r.wallet,
                        demo: r.demo,
                        createdAt: r.createdAt,
                      }))
                    : shownPayments.map((p) => ({
                        id: p.id,
                        kind: p.kind,
                        amount: p.amountUsd,
                        recipient: p.recipient,
                        settled: p.settled,
                      })),
                )
              }
            >
              Export CSV
            </Button>
          </>
        }
      />

      <StatusBanner
        tone={receipts.length + payments.length ? "up" : "neutral"}
        title={`${receipts.length + payments.length} public proofs`}
        body={`${receipts.length} Altana · ${payments.length} x402 · $${volume.toFixed(2)} volume · ${settled} settled`}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            [receipts.length, "Altana"],
            [actionCounts.grant, "Grants"],
            [actionCounts.revoke, "Revokes"],
            [payments.length, "x402"],
            [settled, "Settled"],
            [`$${volume.toFixed(2)}`, "Volume"],
          ] as const
        ).map(([n, l]) => (
          <div key={l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
            <div className="num text-xl font-semibold text-bas-primary">{n}</div>
            <div className="mt-0.5 text-[11px] text-bas-muted">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <ChipRow>
          <Chip active={tab === "altana"} onClick={() => setTab("altana")}>
            Altana <span className={`num ${tab === "altana" ? "" : "text-bas-muted"}`}>{receipts.length}</span>
          </Chip>
          <Chip active={tab === "x402"} onClick={() => setTab("x402")}>
            x402 <span className={`num ${tab === "x402" ? "" : "text-bas-muted"}`}>{payments.length}</span>
          </Chip>
        </ChipRow>
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={tab === "altana" ? "Search agent, wallet, action" : "Search payment, kind, recipient"}
        />
        {tab === "altana" ? (
          <ChipRow>
            {actionFilters.map((f) => (
              <Chip key={f.id} active={actionFilter === f.id} onClick={() => setActionFilter(f.id)}>
                {f.label}{" "}
                <span className={`num ${actionFilter === f.id ? "" : "text-bas-muted"}`}>{actionCounts[f.id]}</span>
              </Chip>
            ))}
          </ChipRow>
        ) : (
          <ChipRow>
            {kindFilters.map((k) => (
              <Chip key={k} active={kindFilter === k} onClick={() => setKindFilter(k)}>
                {k === "all" ? "All" : k}{" "}
                <span className={`num ${kindFilter === k ? "" : "text-bas-muted"}`}>{kindCounts[k] ?? 0}</span>
              </Chip>
            ))}
          </ChipRow>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
      <p className="mt-4 text-xs text-bas-muted">
        Showing <span className="num">{tab === "altana" ? shownReceipts.length : shownPayments.length}</span> of{" "}
        {tab === "altana" ? receipts.length : payments.length}
        {tab === "altana" && demoReceipts ? (
          <>
            {" · "}
            <span className="num">{demoReceipts}</span> demo
          </>
        ) : null}
      </p>

      {loading ? (
        <Skeleton rows={5} />
      ) : tab === "altana" ? (
        <ResponsiveTable
          rows={shownReceipts}
          rowKey={(r) => r.id}
          leading={(r) => <Mark name={r.agentName} />}
          mobilePrimary={(r) => `${r.action} · ${r.agentName}`}
          mobileSecondary={(r) => (
            <div className="flex flex-wrap items-center gap-2">
              <ActionBadge action={r.action} />
              {r.demo ? <span className="text-[11px]">demo</span> : null}
              <a href={r.explorer} className="text-bas-primary">
                {shortAddr(r.wallet)}
              </a>
              <CopyText value={r.id} />
            </div>
          )}
          mobileActions={(r) => (
            <>
              <Button size="sm" variant="secondary" onClick={() => setOpen(r)}>
                Details
              </Button>
              <Button size="sm" variant="secondary" href={r.explorer}>
                Explorer
              </Button>
            </>
          )}
          columns={[
            {
              label: "Action",
              cell: (r) => (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionBadge action={r.action} />
                    {r.demo ? (
                      <span className="rounded-[4px] border border-bas-hairline px-1.5 py-0.5 text-[10px] text-bas-muted">
                        demo
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1">
                    <CopyText value={r.id} />
                  </div>
                </>
              ),
            },
            {
              label: "Agent",
              cell: (r) => (
                <button
                  type="button"
                  className="text-left font-medium text-bas-heading hover:text-bas-primary"
                  onClick={() => setOpen(r)}
                >
                  {r.agentName}
                </button>
              ),
            },
            {
              label: "Wallet",
              cell: (r) => (
                <a href={r.explorer} className="num text-xs text-bas-primary hover:underline">
                  {shortAddr(r.wallet)}
                </a>
              ),
            },
            { label: "Cap", cell: (r) => <span className="num text-xs">{r.spendCap} {r.spendToken}</span> },
            { label: "When", cell: (r) => <span className="num text-xs text-bas-muted">{ago(r.createdAt)}</span> },
            {
              label: "",
              className: "text-right",
              cell: (r) => (
                <Button size="sm" variant="secondary" onClick={() => setOpen(r)}>
                  Details
                </Button>
              ),
            },
          ]}
          empty={<EmptyState title="No receipts" body="Hire or revoke a session on this instance." />}
        />
      ) : (
        <ResponsiveTable
          rows={shownPayments}
          rowKey={(p) => p.id}
          leading={(p) => <Mark name={p.kind} />}
          mobilePrimary={(p) => p.kind}
          mobileSecondary={(p) => (
            <div className="flex flex-wrap items-center gap-2">
              <span className="num">
                ${p.amountUsd.toFixed(2)} {p.asset}
              </span>
              {p.settled ? <span className="text-bas-up">settled</span> : <span className="text-bas-muted">open</span>}
              {p.demo ? <span className="text-[11px]">demo</span> : null}
              <CopyText value={p.id} />
            </div>
          )}
          columns={[
            {
              label: "Payment",
              cell: (p) => (
                <>
                  <CopyText value={p.id} />
                  <div className="mt-0.5 text-xs text-bas-muted">{p.facilitator}</div>
                </>
              ),
            },
            { label: "Kind", cell: (p) => <KindBadge kind={p.kind} /> },
            {
              label: "Amount",
              cell: (p) => (
                <span className="num">
                  ${p.amountUsd.toFixed(2)} {p.asset}
                </span>
              ),
            },
            {
              label: "Status",
              cell: (p) => (
                <span className={p.settled ? "text-xs text-bas-up" : "text-xs text-bas-muted"}>
                  {p.settled ? "Settled" : p.demo ? "Demo" : "Recorded"}
                </span>
              ),
            },
            {
              label: "Recipient",
              cell: (p) => <span className="num text-xs text-bas-muted">{shortAddr(p.recipient)}</span>,
            },
            {
              label: "When",
              cell: (p) => <span className="num text-xs text-bas-muted">{ago(p.paidAt)}</span>,
            },
          ]}
          empty={<EmptyState title="No payments" body="x402 receipts appear after a hire." />}
        />
      )}

      {open ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-bas-overlay md:items-stretch md:justify-end">
          <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => setOpen(null)} />
          <aside className="admin-panel relative z-10 max-h-[85dvh] w-full overflow-y-auto rounded-t-[16px] border border-bas-hairline bg-bas-surface-soft p-5 admin-safe md:h-full md:max-h-none md:max-w-md md:rounded-none md:border-l">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Mark name={open.agentName} />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-bas-heading">{open.agentName}</h2>
                  <CopyText value={open.id} />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ActionBadge action={open.action} />
                    {open.demo ? (
                      <span className="rounded-[4px] border border-bas-hairline px-1.5 py-0.5 text-[10px] text-bas-muted">
                        demo
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>
                Close
              </Button>
            </div>
            <dl className="mt-5 space-y-2.5 text-sm">
              <Row k="Session" v={open.sessionId} />
              <Row k="Owner" v={shortAddr(open.owner)} />
              <Row k="Wallet" v={shortAddr(open.wallet)} />
              <Row k="Cap" v={`${open.spendCap} ${open.spendToken}`} />
              <Row k="When" v={ago(open.createdAt)} />
              <Row k="Grant hash" v={open.grantHash ? shortAddr(open.grantHash, 6) : "—"} />
              <Row k="Revoke hash" v={open.revokeHash ? shortAddr(open.revokeHash, 6) : "—"} />
            </dl>
            {open.allowlist.length ? (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-bas-muted">Allowlist</p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {open.allowlist.map((a) => (
                    <li key={a.address} className="flex justify-between gap-2">
                      <span>{a.label}</span>
                      <span className="num text-bas-muted">{shortAddr(a.address)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-6">
              <Button size="sm" variant="secondary" href={open.explorer}>
                Altana explorer
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-bas-muted">{k}</dt>
      <dd className="num max-w-[60%] truncate text-right text-bas-heading" title={v}>
        {v}
      </dd>
    </div>
  );
}
