"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, FieldInput, ResponsiveTable } from "@/components/admin/ResponsiveTable";
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
      <div className="mt-5 space-y-3">
        <ChipRow>
          <Chip active={tab === "altana"} onClick={() => setTab("altana")}>
            Altana ({receipts.length})
          </Chip>
          <Chip active={tab === "x402"} onClick={() => setTab("x402")}>
            x402 ({payments.length})
          </Chip>
        </ChipRow>
        <FieldInput value={q} onChange={setQ} placeholder="Search proofs" />
      </div>
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}

      {tab === "altana" ? (
        <ResponsiveTable
          rows={shownReceipts}
          rowKey={(r) => r.id}
          mobilePrimary={(r) => `${r.action} · ${r.agentName}`}
          mobileSecondary={(r) => (
            <div className="flex flex-wrap gap-2">
              <CopyText value={r.id} />
              <a href={r.explorer} className="text-bas-primary">
                {shortAddr(r.wallet)}
              </a>
            </div>
          )}
          columns={[
            {
              label: "Action",
              cell: (r) => (
                <>
                  {r.action}
                  {r.demo ? <span className="ml-2 text-xs text-bas-muted">demo</span> : null}
                  <div>
                    <CopyText value={r.id} />
                  </div>
                </>
              ),
            },
            { label: "Agent", cell: (r) => r.agentName },
            {
              label: "Wallet",
              cell: (r) => (
                <a href={r.explorer} className="num text-xs text-bas-primary">
                  {shortAddr(r.wallet)}
                </a>
              ),
            },
            { label: "When", cell: (r) => <span className="num text-xs text-bas-muted">{timeAgo(new Date(r.createdAt).toISOString())}</span> },
          ]}
          empty={<EmptyState title="No receipts" body="Hire or revoke a session on this instance." />}
        />
      ) : (
        <ResponsiveTable
          rows={shownPayments}
          rowKey={(p) => p.id}
          mobilePrimary={(p) => p.kind}
          mobileSecondary={(p) => (
            <div className="flex flex-wrap gap-2">
              <span className="num">
                ${p.amountUsd} {p.asset}
              </span>
              <CopyText value={p.id} />
            </div>
          )}
          columns={[
            {
              label: "Payment",
              cell: (p) => (
                <>
                  <CopyText value={p.id} />
                  <div className="text-xs text-bas-muted">{p.facilitator}</div>
                </>
              ),
            },
            { label: "Kind", cell: (p) => p.kind },
            {
              label: "Amount",
              cell: (p) => (
                <span className="num">
                  ${p.amountUsd} {p.asset}
                </span>
              ),
            },
            { label: "Recipient", cell: (p) => <span className="num text-xs">{p.recipient}</span> },
          ]}
          empty={<EmptyState title="No payments" body="x402 receipts appear after a hire." />}
        />
      )}
    </div>
  );
}
