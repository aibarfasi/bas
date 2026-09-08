"use client";

import { useEffect, useMemo, useState } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, FieldInput, ResponsiveTable } from "@/components/admin/ResponsiveTable";
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
      <div className="mt-5 space-y-3">
        <ChipRow>
          {(["sessions", "jobs"] as const).map((t) => (
            <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
              {t === "sessions" ? `Sessions (${sessions.length})` : `Jobs (${jobs.length})`}
            </Chip>
          ))}
        </ChipRow>
        <FieldInput value={q} onChange={setQ} placeholder="Search agent, owner, id" />
        {tab === "sessions" ? (
          <ChipRow>
            {(["all", "active", "revoked", "expired"] as const).map((s) => (
              <Chip key={s} active={stateFilter === s} onClick={() => setStateFilter(s)}>
                {s}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}

      {tab === "sessions" ? (
        <ResponsiveTable
          rows={shownSessions}
          rowKey={(s) => s.id}
          mobilePrimary={(s) => s.agentName}
          mobileSecondary={(s) => (
            <div className="flex flex-wrap gap-2">
              <span className={sessionState(s) === "active" ? "text-bas-up" : "text-bas-muted"}>
                {sessionState(s)}
              </span>
              <span>
                {s.spendCap} {s.spendToken}
              </span>
              <CopyText value={s.id} />
            </div>
          )}
          mobileActions={(s) => (
            <>
              <button type="button" className="text-bas-primary" onClick={() => setOpen(s)}>
                Details
              </button>
              {sessionState(s) === "active" ? (
                <button type="button" className="text-bas-down" onClick={() => setRevokeId(s.id)}>
                  Revoke
                </button>
              ) : null}
            </>
          )}
          columns={[
            {
              label: "Agent",
              cell: (s) => (
                <>
                  <button type="button" className="text-left text-bas-heading hover:text-bas-primary" onClick={() => setOpen(s)}>
                    {s.agentName}
                  </button>
                  <div>
                    <CopyText value={s.id} />
                  </div>
                </>
              ),
            },
            { label: "Owner", cell: (s) => <span className="num text-xs">{shortAddr(s.owner)}</span> },
            {
              label: "Cap",
              cell: (s) => (
                <span className="num">
                  {s.spendCap} {s.spendToken}
                </span>
              ),
            },
            {
              label: "State",
              cell: (s) => (
                <span className={sessionState(s) === "active" ? "text-bas-up" : sessionState(s) === "revoked" ? "text-bas-down" : "text-bas-muted"}>
                  {sessionState(s)}
                  {s.demo ? <span className="ml-2 text-xs text-bas-muted">demo</span> : null}
                </span>
              ),
            },
            { label: "Proof", cell: (s) => <span className="num text-xs text-bas-muted">{s.ledgerId || "—"}</span> },
            {
              label: "",
              cell: (s) =>
                sessionState(s) === "active" ? (
                  <button type="button" className="text-xs text-bas-down" onClick={() => setRevokeId(s.id)}>
                    Revoke
                  </button>
                ) : null,
            },
          ]}
          empty={<EmptyState title="No sessions" body="Hire once, or sync this browser." />}
        />
      ) : (
        <ResponsiveTable
          rows={shownJobs}
          rowKey={(j) => j.id}
          mobilePrimary={(j) => j.agentName}
          mobileSecondary={(j) => (
            <div className="flex flex-wrap gap-2">
              <span>{j.deliverable.title}</span>
              <span className="num">${j.paidUsd.toFixed(2)}</span>
              <span>{j.status}</span>
            </div>
          )}
          columns={[
            {
              label: "Job",
              cell: (j) => (
                <>
                  {j.agentName}
                  <div className="text-xs text-bas-muted">{j.deliverable.title}</div>
                </>
              ),
            },
            { label: "Rail", cell: (j) => <span className="num text-xs">{j.rail}</span> },
            { label: "Paid", cell: (j) => <span className="num">${j.paidUsd.toFixed(2)}</span> },
            { label: "Status", cell: (j) => j.status },
            { label: "When", cell: (j) => <span className="num text-xs text-bas-muted">{timeAgo(new Date(j.startedAt).toISOString())}</span> },
          ]}
          empty={<EmptyState title="No jobs" body="A hire writes a job after x402 settles." />}
        />
      )}

      {open ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 md:items-stretch md:justify-end">
          <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => setOpen(null)} />
          <aside className="relative z-10 max-h-[85dvh] w-full overflow-y-auto rounded-t-[16px] border border-bas-hairline bg-bas-canvas p-5 admin-safe md:h-full md:max-h-none md:max-w-md md:rounded-none md:border-l">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-bas-heading">{open.agentName}</h2>
                <CopyText value={open.id} />
              </div>
              <button type="button" className="h-10 px-2 text-sm text-bas-muted" onClick={() => setOpen(null)}>
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
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
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
