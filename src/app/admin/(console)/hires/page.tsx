"use client";

import { useEffect, useMemo, useState } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import { sessionState, type HiredSession } from "@/lib/altana/sessions";
import type { HireJob } from "@/lib/hire/types";
import { useHireStore } from "@/lib/hire/store";
import { altanaExplorer, shortAddr, timeAgo } from "@/lib/format";

export default function AdminHiresPage() {
  const toast = useToast();
  const [tab, setTab] = useState<"sessions" | "jobs">("sessions");
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | "active" | "revoked" | "expired">("all");
  const [sessions, setSessions] = useState<HiredSession[]>([]);
  const [jobs, setJobs] = useState<HireJob[]>([]);
  const [open, setOpen] = useState<HiredSession | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localSessions = useHireStore((s) => s.sessions);
  const localJobs = useHireStore((s) => s.jobs);

  async function load() {
    const [s, j] = await Promise.all([
      adminFetch<{ sessions: HiredSession[] }>("/api/admin/sessions"),
      adminFetch<{ jobs: HireJob[] }>("/api/admin/jobs"),
    ]);
    setSessions(s.sessions);
    setJobs(j.jobs);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  const shownSessions = useMemo(() => {
    return sessions.filter((s) => {
      const st = sessionState(s);
      if (stateFilter !== "all" && st !== stateFilter) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return `${s.agentName} ${s.id} ${s.owner} ${s.wallet}`.toLowerCase().includes(n);
    });
  }, [sessions, q, stateFilter]);

  const shownJobs = useMemo(() => {
    if (!q) return jobs;
    const n = q.toLowerCase();
    return jobs.filter((j) => `${j.agentName} ${j.id} ${j.deliverable.title}`.toLowerCase().includes(n));
  }, [jobs, q]);

  async function revoke(id: string) {
    await adminFetch("/api/admin/sessions", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    toast("ok", "Session revoked");
    setRevokeId(null);
    setOpen(null);
    await load();
  }

  async function syncLocal() {
    for (const session of localSessions) {
      const job = localJobs.find((j) => j.sessionId === session.id);
      await fetch("/api/ops/hires", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session, job }),
      });
    }
    toast("ok", `Synced ${localSessions.length} local sessions`);
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Hires"
        desc="Server mirror of Altana sessions and x402 jobs. Sync this browser if a hire happened before ingest."
        actions={
          <>
            <Button variant="secondary" onClick={syncLocal}>
              Sync this browser
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  tab === "sessions" ? "bas-sessions.csv" : "bas-jobs.csv",
                  tab === "sessions"
                    ? shownSessions.map((s) => ({
                        id: s.id,
                        agent: s.agentName,
                        owner: s.owner,
                        cap: s.spendCap,
                        state: sessionState(s),
                        demo: s.demo,
                      }))
                    : shownJobs.map((j) => ({
                        id: j.id,
                        agent: j.agentName,
                        rail: j.rail,
                        paid: j.paidUsd,
                        status: j.status,
                      })),
                )
              }
            >
              Export CSV
            </Button>
          </>
        }
      />
      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-2">
          {(["sessions", "jobs"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`h-9 rounded-[6px] px-3 text-sm ${
                tab === t ? "bg-bas-primary text-bas-on-primary" : "bg-bas-card"
              }`}
            >
              {t === "sessions" ? `Sessions (${sessions.length})` : `Jobs (${jobs.length})`}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search agent, owner, id"
          className="h-9 w-full max-w-sm rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm"
        />
        {tab === "sessions" ? (
          <div className="flex gap-2">
            {(["all", "active", "revoked", "expired"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStateFilter(s)}
                className={`h-9 rounded-[6px] px-3 text-xs ${
                  stateFilter === s ? "bg-bas-primary text-bas-on-primary" : "bg-bas-card"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}

      {tab === "sessions" ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="text-xs text-bas-muted">
              <tr>
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Owner</th>
                <th className="pb-2 font-medium">Cap</th>
                <th className="pb-2 font-medium">State</th>
                <th className="pb-2 font-medium">Proof</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {shownSessions.map((s) => {
                const st = sessionState(s);
                return (
                  <tr key={s.id} className="border-t border-bas-hairline">
                    <td className="py-3">
                      <button type="button" className="text-left text-bas-heading hover:text-bas-primary" onClick={() => setOpen(s)}>
                        {s.agentName}
                      </button>
                      <div className="num text-xs text-bas-muted">{s.id}</div>
                    </td>
                    <td className="num text-xs">{shortAddr(s.owner)}</td>
                    <td className="num">
                      {s.spendCap} {s.spendToken}
                    </td>
                    <td>
                      <span
                        className={
                          st === "active" ? "text-bas-up" : st === "revoked" ? "text-bas-down" : "text-bas-muted"
                        }
                      >
                        {st}
                      </span>
                      {s.demo ? <span className="ml-2 text-xs text-bas-muted">demo</span> : null}
                    </td>
                    <td className="num text-xs text-bas-muted">{s.ledgerId || "—"}</td>
                    <td>
                      {st === "active" ? (
                        <button type="button" className="text-xs text-bas-down" onClick={() => setRevokeId(s.id)}>
                          Revoke
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shownSessions.length === 0 ? (
            <p className="mt-4 text-sm text-bas-muted">No mirrored sessions yet. Hire once, or sync this browser.</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-bas-muted">
              <tr>
                <th className="pb-2 font-medium">Job</th>
                <th className="pb-2 font-medium">Rail</th>
                <th className="pb-2 font-medium">Paid</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {shownJobs.map((j) => (
                <tr key={j.id} className="border-t border-bas-hairline">
                  <td className="py-3">
                    {j.agentName}
                    <div className="text-xs text-bas-muted">{j.deliverable.title}</div>
                  </td>
                  <td className="num text-xs">{j.rail}</td>
                  <td className="num">${j.paidUsd.toFixed(2)}</td>
                  <td>{j.status}</td>
                  <td className="num text-xs text-bas-muted">{timeAgo(new Date(j.startedAt).toISOString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/50">
          <aside className="h-full w-full max-w-md overflow-y-auto border-l border-bas-hairline bg-bas-canvas p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-bas-heading">{open.agentName}</h2>
                <p className="num text-xs text-bas-muted">{open.id}</p>
              </div>
              <button type="button" className="text-sm text-bas-muted" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="State" v={sessionState(open)} />
              <Row k="Owner" v={shortAddr(open.owner)} />
              <Row k="Wallet" v={shortAddr(open.wallet)} />
              <Row k="Cap" v={`${open.spendCap} ${open.spendToken}`} />
              <Row k="Ledger" v={open.ledgerId || "—"} />
              <Row k="Payment" v={open.paymentId || "—"} />
              <Row k="Demo" v={open.demo ? "yes" : "no"} />
            </dl>
            <ul className="mt-4 space-y-1 text-xs">
              {open.allowlist.map((a) => (
                <li key={a.address} className="flex justify-between gap-2">
                  <span>{a.label}</span>
                  <span className="num text-bas-muted">{shortAddr(a.address)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={altanaExplorer(open.wallet)} className="text-sm text-bas-primary">
                Altana explorer
              </a>
              {sessionState(open) === "active" ? (
                <button type="button" className="text-sm text-bas-down" onClick={() => setRevokeId(open.id)}>
                  Revoke session
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {revokeId ? (
        <Confirm
          title="Revoke session"
          body="The agent loses spend permission immediately. A public revoke receipt is written."
          confirm="Revoke"
          danger
          onCancel={() => setRevokeId(null)}
          onConfirm={() => revoke(revokeId)}
        />
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-bas-muted">{k}</dt>
      <dd className="num">{v}</dd>
    </div>
  );
}
