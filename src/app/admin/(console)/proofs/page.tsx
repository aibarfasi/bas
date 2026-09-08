"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import type { SessionReceipt } from "@/lib/altana/ledger";
import type { X402Receipt } from "@/lib/x402/receipts";
import { shortAddr, timeAgo } from "@/lib/format";

export default function AdminProofsPage() {
  const [tab, setTab] = useState<"altana" | "x402">("altana");
  const [q, setQ] = useState("");
  const [receipts, setReceipts] = useState<SessionReceipt[]>([]);
  const [payments, setPayments] = useState<X402Receipt[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch<{ receipts: SessionReceipt[] }>("/api/admin/receipts"),
      adminFetch<{ payments: X402Receipt[] }>("/api/admin/payments"),
    ])
      .then(([r, p]) => {
        setReceipts(r.receipts);
        setPayments(p.payments);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  const shownReceipts = useMemo(() => {
    if (!q) return receipts;
    const n = q.toLowerCase();
    return receipts.filter((r) => `${r.agentName} ${r.id} ${r.wallet} ${r.action}`.toLowerCase().includes(n));
  }, [receipts, q]);

  const shownPayments = useMemo(() => {
    if (!q) return payments;
    const n = q.toLowerCase();
    return payments.filter((p) => `${p.id} ${p.kind} ${p.recipient}`.toLowerCase().includes(n));
  }, [payments, q]);

  return (
    <div>
      <PageHeader
        title="Proofs"
        desc="Public Altana receipts and x402 payment records from this runtime. In-memory on Vercel."
        actions={
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
                    }))
                  : shownPayments.map((p) => ({
                      id: p.id,
                      kind: p.kind,
                      amount: p.amountUsd,
                      recipient: p.recipient,
                    })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("altana")}
            className={`h-9 rounded-[6px] px-3 text-sm ${
              tab === "altana" ? "bg-bas-primary text-bas-on-primary" : "bg-bas-card"
            }`}
          >
            Altana ({receipts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("x402")}
            className={`h-9 rounded-[6px] px-3 text-sm ${
              tab === "x402" ? "bg-bas-primary text-bas-on-primary" : "bg-bas-card"
            }`}
          >
            x402 ({payments.length})
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search proofs"
          className="h-9 w-full max-w-sm rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm"
        />
      </div>
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}

      {tab === "altana" ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-bas-muted">
              <tr>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Wallet</th>
                <th className="pb-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {shownReceipts.map((r) => (
                <tr key={r.id} className="border-t border-bas-hairline">
                  <td className="py-3">
                    {r.action}
                    {r.demo ? <span className="ml-2 text-xs text-bas-muted">demo</span> : null}
                    <div className="num text-xs text-bas-muted">{r.id}</div>
                  </td>
                  <td>{r.agentName}</td>
                  <td>
                    <a href={r.explorer} className="num text-xs text-bas-primary">
                      {shortAddr(r.wallet)}
                    </a>
                  </td>
                  <td className="num text-xs text-bas-muted">{timeAgo(new Date(r.createdAt).toISOString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shownReceipts.length === 0 ? (
            <p className="mt-4 text-sm text-bas-muted">No receipts on this instance yet.</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-bas-muted">
              <tr>
                <th className="pb-2 font-medium">Payment</th>
                <th className="pb-2 font-medium">Kind</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Recipient</th>
              </tr>
            </thead>
            <tbody>
              {shownPayments.map((p) => (
                <tr key={p.id} className="border-t border-bas-hairline">
                  <td className="py-3">
                    <div className="num text-xs">{p.id}</div>
                    <div className="text-xs text-bas-muted">{p.facilitator}</div>
                  </td>
                  <td>{p.kind}</td>
                  <td className="num">
                    ${p.amountUsd} {p.asset}
                  </td>
                  <td className="num text-xs">{p.recipient}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
