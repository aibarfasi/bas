"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { altanaExplorer, explorerAddress, shortAddr } from "@/lib/format";
import { sessionState } from "@/lib/altana/sessions";
import { useHireStore } from "@/lib/hire/store";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const session = useHireStore((s) => s.sessions.find((x) => x.id === id));
  const job = useHireStore((s) => s.jobs.find((j) => j.sessionId === id));
  const revokeSession = useHireStore((s) => s.revokeSession);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!session) {
    return (
      <AppShell light>
        <h1 className="text-2xl font-semibold">Session not found</h1>
        <p className="mt-2 text-sm text-bas-muted">
          Sessions live in this browser. Hire an agent first.
        </p>
        <Button href="/market" className="mt-4">
          Market
        </Button>
      </AppShell>
    );
  }

  const state = sessionState(session);
  const left = Math.max(0, session.expiry - Math.floor(now / 1000));
  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  async function revoke() {
    if (!session) return;
    setBusy(true);
    try {
      let sig: string | null = null;
      if (isConnected) {
        sig = await signMessageAsync({
          message: `BAS revoke session ${session.id} wallet ${session.wallet}`,
        });
      }
      revokeSession(session.id, sig);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell light>
      <p className="text-xs text-bas-muted">Altana session · transactional</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{session.agentName}</h1>
        <span
          className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold ${
            state === "active"
              ? "bg-bas-up text-white"
              : state === "revoked"
                ? "bg-bas-down text-white"
                : "bg-bas-surface-strong"
          }`}
        >
          {state}
        </span>
      </div>
      <p className="num mt-2 text-sm text-bas-muted">{session.id}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[12px] border border-bas-hairline-light bg-white p-5">
          <div className="text-xs text-bas-muted">Spend cap</div>
          <div className="num mt-2 text-2xl font-bold">
            {session.spendCap} {session.spendToken}
          </div>
        </div>
        <div className="rounded-[12px] border border-bas-hairline-light bg-white p-5">
          <div className="text-xs text-bas-muted">Expires in</div>
          <div className="num mt-2 text-2xl font-bold">
            {state === "active" ? `${hh}:${mm}:${ss}` : "—"}
          </div>
        </div>
        <div className="rounded-[12px] border border-bas-hairline-light bg-white p-5">
          <div className="text-xs text-bas-muted">Mode</div>
          <div className="mt-2 text-2xl font-bold">
            {session.demo ? "Demo" : "Signed"}
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-[12px] border border-bas-hairline-light bg-white p-5">
        <h2 className="font-semibold">Allowlist</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {session.allowlist.length ? (
            session.allowlist.map((a) => (
              <li key={a.address} className="flex justify-between gap-3">
                <span>{a.label}</span>
                <a
                  className="num text-bas-muted"
                  href={explorerAddress(session.chainId, a.address)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortAddr(a.address)}
                </a>
              </li>
            ))
          ) : (
            <li>Empty allowlist — read-only session.</li>
          )}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-bas-muted">Agent wallet</dt>
            <dd>
              <a
                href={altanaExplorer(session.wallet)}
                className="num text-bas-primary"
                target="_blank"
                rel="noreferrer"
              >
                {shortAddr(session.wallet)}
              </a>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">Owner</dt>
            <dd className="num">{shortAddr(session.owner)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">Grant sig</dt>
            <dd className="num truncate">{session.grantSig ? shortAddr(session.grantSig, 6) : "demo"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bas-muted">Revoke sig</dt>
            <dd className="num">{session.revokeSig ? shortAddr(session.revokeSig, 6) : "—"}</dd>
          </div>
        </dl>
        {state === "active" ? (
          <Button className="mt-5" variant="danger" disabled={busy} onClick={revoke}>
            {busy ? "Revoking…" : "Revoke session"}
          </Button>
        ) : (
          <p className="mt-5 text-sm text-bas-muted">
            Authority is already pulled. Grant a new session to restore access.
          </p>
        )}
        <p className="mt-3 text-xs text-bas-muted">
          Altana judges read live KeyStore txs. This page is the product surface:
          cap, expiry, allowlist, revoke. When bag + Altana SDK are wired on a
          funded wallet, grantTx / revokeTx appear as explorer links.
        </p>
      </section>

      {job ? (
        <section className="mt-4 rounded-[12px] border border-bas-hairline-light bg-white p-5">
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
        </section>
      ) : null}

      <div className="mt-6 flex gap-3">
        <Button href="/market" variant="secondary">
          Market
        </Button>
        <Link href="/advantage" className="text-sm leading-10 text-bas-muted">
          Advantage report
        </Link>
      </div>
    </AppShell>
  );
}
