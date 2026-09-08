"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { altanaExplorer, explorerAddress, explorerTx, shortAddr } from "@/lib/format";
import {
  normalizeSession,
  remainingCap,
  sessionState,
  type HiredSession,
} from "@/lib/altana/sessions";
import type { HireJob } from "@/lib/hire/types";
import { useHireStore } from "@/lib/hire/store";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const local = useHireStore((s) => s.sessions.find((x) => x.id === id));
  const localJob = useHireStore((s) => s.jobs.find((j) => j.sessionId === id));
  const upsertSession = useHireStore((s) => s.upsertSession);
  const revokeSession = useHireStore((s) => s.revokeSession);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [remote, setRemote] = useState<HiredSession | null>(null);
  const [remoteJob, setRemoteJob] = useState<HireJob | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [hours, setHours] = useState(24);
  const [extraCap, setExtraCap] = useState("0.05");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!local);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { session?: HiredSession; job?: HireJob } | null) => {
        if (d?.session) {
          const ses = normalizeSession(d.session);
          setRemote(ses);
          upsertSession(ses);
        }
        if (d?.job) setRemoteJob(d.job);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id, upsertSession]);

  const current = local ? normalizeSession(local) : remote;
  const job = localJob ?? remoteJob;

  if (loading && !current) {
    return (
      <AppShell>
        <p className="text-sm text-bas-muted">Loading session…</p>
      </AppShell>
    );
  }

  if (!current) {
    return (
      <AppShell>
        <h1 className="text-2xl font-semibold">Session not found</h1>
        <p className="mt-2 text-sm text-bas-muted">
          Hire an agent first. Sessions persist in this browser and on the server when available.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/hire/97-bas-rebalance">Hire Range Guard</Button>
          <Button href="/market" variant="secondary">
            Market
          </Button>
        </div>
      </AppShell>
    );
  }

  const ses: HiredSession = current;
  const state = sessionState(ses);
  const left = Math.max(0, ses.expiry - Math.floor(now / 1000));
  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const remaining = remainingCap(ses);
  const readOnly = Number(ses.spendCap) === 0;

  async function push(action: "renew" | "topup" | "dispute", extra?: { hours?: number; extraCap?: string; reason?: string; sig?: string | null }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${ses.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = (await res.json()) as { session?: HiredSession; error?: string };
      if (!res.ok || !data.session) throw new Error(data.error || "Update failed");
      const next = normalizeSession(data.session);
      upsertSession(next);
      setRemote(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setError(null);
    try {
      let sig: string | null = null;
      if (isConnected) {
        sig = await signMessageAsync({
          message: `BAS revoke session ${ses.id} wallet ${ses.wallet}`,
        });
      }
      revokeSession(ses.id, sig);
      fetch("/api/ops/hires", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ revoke: { id: ses.id, sig } }),
      }).catch(() => null);
      await fetch("/api/altana/receipts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          sessionId: ses.id,
          agentId: ses.agentId,
          agentName: ses.agentName,
          wallet: ses.wallet,
          owner: ses.owner,
          spendCap: ses.spendCap,
          spendToken: ses.spendToken,
          expiry: ses.expiry,
          allowlist: ses.allowlist,
          grantSig: ses.grantSig,
          revokeSig: sig,
          grantHash: ses.grantHash,
          grantTx: ses.grantTx,
          revokeTx: ses.revokeTx,
          demo: ses.demo,
          chainId: ses.chainId,
        }),
      }).catch(() => null);
    } finally {
      setBusy(false);
    }
  }

  async function dispute() {
    let sig: string | null = null;
    if (isConnected) {
      sig = await signMessageAsync({
        message: `BAS dispute session ${ses.id}: ${reason || "kill switch"}`,
      });
    }
    await push("dispute", { reason: reason || "Hirer's kill switch", sig });
  }

  return (
    <AppShell>
      <p className="text-xs text-bas-muted">Altana session · transactional</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{current.agentName}</h1>
        <span
          className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold ${
            state === "active"
              ? "bg-bas-up text-white"
              : state === "disputed"
                ? "bg-bas-down text-white"
                : state === "revoked"
                  ? "bg-bas-down text-white"
                  : "bg-bas-surface-strong"
          }`}
        >
          {state}
        </span>
      </div>
      <p className="num mt-2 text-sm text-bas-muted">{current.id}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-[12px] bg-bas-card p-5">
          <div className="text-xs text-bas-muted">Spend cap</div>
          <div className="num mt-2 text-2xl font-bold">
            {current.spendCap} {current.spendToken}
          </div>
        </div>
        <div className="rounded-[12px] bg-bas-card p-5">
          <div className="text-xs text-bas-muted">Remaining</div>
          <div className="num mt-2 text-2xl font-bold">
            {remaining} {current.spendToken}
          </div>
        </div>
        <div className="rounded-[12px] bg-bas-card p-5">
          <div className="text-xs text-bas-muted">Expires in</div>
          <div className="num mt-2 text-2xl font-bold">
            {state === "active" ? `${hh}:${mm}:${ss}` : "—"}
          </div>
        </div>
        <div className="rounded-[12px] bg-bas-card p-5">
          <div className="text-xs text-bas-muted">Mode</div>
          <div className="mt-2 text-2xl font-bold">
            {current.demo ? "Demo" : "Signed"}
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-[12px] bg-bas-card p-5">
        <h2 className="font-semibold">Activity</h2>
        <p className="mt-1 text-xs text-bas-muted">
          Quotes, allowlist checks, payments, renewals, and kill-switch events. Remaining cap stays in your wallet.
        </p>
        {current.events.length ? (
          <ol className="mt-4 space-y-3">
            {current.events.map((ev) => (
              <li key={ev.id} className="border-b border-bas-hairline pb-3 last:border-0">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium text-bas-heading">{ev.label}</span>
                  <span className="num text-xs text-bas-muted">{new Date(ev.at).toLocaleTimeString()}</span>
                </div>
                <p className="mt-1 text-sm text-bas-muted">{ev.detail}</p>
                {ev.target ? (
                  <p className="num mt-1 text-xs text-bas-muted">{shortAddr(ev.target)}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-bas-muted">No events yet.</p>
        )}
      </section>

      <section className="mt-4 rounded-[12px] bg-bas-card p-5">
        <h2 className="font-semibold">Allowlist</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {current.allowlist.length ? (
            current.allowlist.map((a) => (
              <li key={a.address} className="flex justify-between gap-3">
                <span>{a.label}</span>
                <a
                  className="num text-bas-muted"
                  href={explorerAddress(current.chainId, a.address)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortAddr(a.address)}
                </a>
              </li>
            ))
          ) : (
            <li>Empty allowlist — read-only current.</li>
          )}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-bas-muted">Agent wallet</dt>
            <dd>
              <a
                href={altanaExplorer(current.wallet)}
                className="num text-bas-primary"
                target="_blank"
                rel="noreferrer"
              >
                {shortAddr(current.wallet)}
              </a>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">Owner</dt>
            <dd className="num">{shortAddr(current.owner)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-bas-muted">Grant commitment</dt>
            <dd className="num truncate">{current.grantHash ? shortAddr(current.grantHash, 6) : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">Grant tx</dt>
            <dd>
              {current.grantTx ? (
                <a
                  href={explorerTx(current.chainId, current.grantTx)}
                  className="num text-bas-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortAddr(current.grantTx, 6)}
                </a>
              ) : (
                <span className="text-bas-muted">Pending bag deploy</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">Revoke tx</dt>
            <dd>
              {current.revokeTx ? (
                <a
                  href={explorerTx(current.chainId, current.revokeTx)}
                  className="num text-bas-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortAddr(current.revokeTx, 6)}
                </a>
              ) : (
                <span className="text-bas-muted">—</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">Grant sig</dt>
            <dd className="num truncate">{current.grantSig ? shortAddr(current.grantSig, 6) : "demo"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">Public receipt</dt>
            <dd>
              {current.ledgerId ? (
                <a
                  href={`/api/altana/receipts?id=${current.ledgerId}`}
                  className="num text-bas-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  {current.ledgerId}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">x402 receipt</dt>
            <dd className="num">{current.paymentId ?? "—"}</dd>
          </div>
        </dl>
        {current.disputeReason ? (
          <p className="mt-4 text-sm text-bas-down">Disputed: {current.disputeReason}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}

        {state === "active" ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-bas-muted">
                Extend (hours)
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="num mt-1 h-10 w-full admin-field px-3 text-bas-heading"
                />
              </label>
              <Button className="mt-2" variant="secondary" disabled={busy} onClick={() => push("renew", { hours })}>
                Renew session
              </Button>
            </div>
            {!readOnly ? (
              <div>
                <label className="block text-xs text-bas-muted">
                  Raise cap ({current.spendToken})
                  <input
                    value={extraCap}
                    onChange={(e) => setExtraCap(e.target.value)}
                    className="num mt-1 h-10 w-full admin-field px-3 text-bas-heading"
                  />
                </label>
                <Button className="mt-2" variant="secondary" disabled={busy} onClick={() => push("topup", { extraCap })}>
                  Top up cap
                </Button>
              </div>
            ) : (
              <p className="text-sm text-bas-muted">Read-only seller — cap stays at 0.</p>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs text-bas-muted">
                Dispute / kill switch
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Allowlist miss, over-cap, or other"
                  className="mt-1 h-10 w-full admin-field px-3 text-sm text-bas-heading"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="danger" disabled={busy} onClick={revoke}>
                  {busy ? "Working…" : "Revoke session"}
                </Button>
                <Button variant="danger" disabled={busy} onClick={dispute}>
                  Dispute & kill
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-bas-muted">
            Authority is already pulled. Grant a new session to restore access.
          </p>
        )}
        <p className="mt-3 text-xs text-bas-muted">
          Grant writes an EIP-712 commitment hash immediately. Explorer KeyStore txs appear after bag deploy.
          Renewals, top-ups, and disputes publish to /proofs.
        </p>
      </section>

      {job ? (
        <section className="mt-4 rounded-[12px] bg-bas-card p-5">
          <h2 className="font-semibold">Deliverable</h2>
          <p className="mt-1 text-xs text-bas-muted">
            {job.rail} · ${job.paidUsd.toFixed(2)} · {job.status}
          </p>
          <h3 className="mt-4 text-lg">{job.deliverable.title}</h3>
          <p className="mt-2 text-sm leading-6">{job.deliverable.summary}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {job.deliverable.outputs.map((o) => (
              <li key={o.label} className="flex justify-between gap-3">
                <span className="text-bas-muted">{o.label}</span>
                <span className="num text-right">{o.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">{job.deliverable.custody}</p>
          <p className="num mt-1 text-xs text-bas-muted">
            Recipient {job.deliverable.recipient}
            {address ? ` · connected ${shortAddr(address)}` : ""}
          </p>
          <a
            className="mt-4 inline-block text-sm text-bas-primary"
            href={`data:application/json,${encodeURIComponent(JSON.stringify(job.deliverable, null, 2))}`}
            download={`${job.id}.json`}
          >
            Download deliverable JSON
          </a>
          {job.deliverable.raw ? (
            <pre className="mt-3 max-h-48 overflow-auto rounded-[8px] bg-bas-canvas p-3 text-xs text-bas-muted">
              {JSON.stringify(job.deliverable.raw, null, 2)}
            </pre>
          ) : null}
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-4">
        <Button href="/market" variant="secondary">
          Market
        </Button>
        <Link href="/advantage" className="text-sm leading-10 text-bas-muted">
          Advantage report
        </Link>
        <Link href="/proofs" className="text-sm leading-10 text-bas-muted">
          Public proofs
        </Link>
      </div>
    </AppShell>
  );
}
