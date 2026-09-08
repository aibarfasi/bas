"use client";

import { useEffect, useMemo, useState } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, ResponsiveTable, SearchField, Skeleton, StatusBanner } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import { remainingCap, sessionState, type HiredSession, type SessionState } from "@/lib/altana/sessions";
import type { HireJob } from "@/lib/hire/types";
import { useHireStore } from "@/lib/hire/store";
import { agentPath, altanaExplorer, shortAddr, timeAgo } from "@/lib/format";

type Tab = "sessions" | "jobs";
type SessionFilter = "all" | SessionState;
type JobFilter = "all" | HireJob["status"];

function atMs(n: number) {
  return n < 1e12 ? n * 1000 : n;
}

function StateBadge({ state }: { state: SessionState }) {
  const cls =
    state === "active"
      ? "border-bas-up/40 bg-bas-up/10 text-bas-up"
      : state === "revoked" || state === "disputed"
        ? "border-bas-down/40 bg-bas-down/10 text-bas-down"
        : "border-bas-hairline text-bas-muted";
  return (
    <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs capitalize ${cls}`}>
      {state}
    </span>
  );
}

function JobBadge({ status }: { status: HireJob["status"] }) {
  const cls =
    status === "delivered"
      ? "border-bas-up/40 bg-bas-up/10 text-bas-up"
      : status === "running"
        ? "border-bas-primary/40 bg-bas-primary/10 text-bas-heading"
        : "border-bas-hairline text-bas-muted";
  return (
    <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs capitalize ${cls}`}>
      {status}
    </span>
  );
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

export default function AdminHiresPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("sessions");
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<SessionFilter>("all");
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");
  const [sessions, setSessions] = useState<HiredSession[]>([]);
  const [jobs, setJobs] = useState<HireJob[]>([]);
  const [open, setOpen] = useState<HiredSession | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const localSessions = useHireStore((s) => s.sessions);
  const localJobs = useHireStore((s) => s.jobs);

  async function load() {
    const [s, j] = await Promise.all([
      adminFetch<{ sessions: HiredSession[] }>("/api/admin/sessions"),
      adminFetch<{ jobs: HireJob[] }>("/api/admin/jobs"),
    ]);
    setSessions(s.sessions);
    setJobs(j.jobs);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    });
  }, []);

  const sessionCounts = useMemo(() => {
    const by = { all: sessions.length, active: 0, revoked: 0, expired: 0, disputed: 0 };
    for (const s of sessions) by[sessionState(s)] += 1;
    return by;
  }, [sessions]);

  const jobCounts = useMemo(() => {
    const by = { all: jobs.length, funded: 0, running: 0, delivered: 0 };
    for (const j of jobs) by[j.status] += 1;
    return by;
  }, [jobs]);

  const volume = useMemo(() => jobs.reduce((n, j) => n + (j.paidUsd || 0), 0), [jobs]);

  const shownSessions = useMemo(() => {
    const n = q.trim().toLowerCase();
    return sessions.filter((s) => {
      const st = sessionState(s);
      if (stateFilter !== "all" && st !== stateFilter) return false;
      if (!n) return true;
      return `${s.agentName} ${s.id} ${s.owner} ${s.wallet} ${s.tokenId}`.toLowerCase().includes(n);
    });
  }, [sessions, q, stateFilter]);

  const shownJobs = useMemo(() => {
    const n = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (jobFilter !== "all" && j.status !== jobFilter) return false;
      if (!n) return true;
      return `${j.agentName} ${j.id} ${j.deliverable.title} ${j.rail}`.toLowerCase().includes(n);
    });
  }, [jobs, q, jobFilter]);

  async function revoke(id: string) {
    setBusy(true);
    try {
      await adminFetch("/api/admin/sessions", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      toast("ok", "Session revoked");
      setRevokeId(null);
      setOpen(null);
      await load();
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setBusy(false);
    }
  }

  async function syncLocal() {
    setBusy(true);
    try {
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
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  const sessionFilters: { id: SessionFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "revoked", label: "Revoked" },
    { id: "expired", label: "Expired" },
    { id: "disputed", label: "Disputed" },
  ];

  const jobFilters: { id: JobFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "funded", label: "Funded" },
    { id: "running", label: "Running" },
    { id: "delivered", label: "Delivered" },
  ];

  return (
    <div>
      <PageHeader
        title="Hires"
        desc="Server mirror of Altana sessions and x402 jobs. Sync this browser if a hire happened before ingest."
        actions={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => void syncLocal()}>
              {busy ? "Working…" : "Sync this browser"}
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
                        spent: s.spent,
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

      <StatusBanner
        tone={sessionCounts.active ? "up" : "neutral"}
        title={`${sessionCounts.active} active session${sessionCounts.active === 1 ? "" : "s"}`}
        body={`${sessions.length} total · ${jobs.length} jobs · $${volume.toFixed(2)} x402 volume`}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            [sessions.length, "Sessions"],
            [sessionCounts.active, "Active"],
            [sessionCounts.revoked, "Revoked"],
            [jobs.length, "Jobs"],
            [jobCounts.delivered, "Delivered"],
            [`$${volume.toFixed(2)}`, "x402 volume"],
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
          <Chip active={tab === "sessions"} onClick={() => setTab("sessions")}>
            Sessions <span className={`num ${tab === "sessions" ? "" : "text-bas-muted"}`}>{sessions.length}</span>
          </Chip>
          <Chip active={tab === "jobs"} onClick={() => setTab("jobs")}>
            Jobs <span className={`num ${tab === "jobs" ? "" : "text-bas-muted"}`}>{jobs.length}</span>
          </Chip>
        </ChipRow>
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={tab === "sessions" ? "Search agent, owner, id" : "Search job, agent, rail"}
        />
        {tab === "sessions" ? (
          <ChipRow>
            {sessionFilters.map((f) => (
              <Chip key={f.id} active={stateFilter === f.id} onClick={() => setStateFilter(f.id)}>
                {f.label}{" "}
                <span className={`num ${stateFilter === f.id ? "" : "text-bas-muted"}`}>{sessionCounts[f.id]}</span>
              </Chip>
            ))}
          </ChipRow>
        ) : (
          <ChipRow>
            {jobFilters.map((f) => (
              <Chip key={f.id} active={jobFilter === f.id} onClick={() => setJobFilter(f.id)}>
                {f.label}{" "}
                <span className={`num ${jobFilter === f.id ? "" : "text-bas-muted"}`}>{jobCounts[f.id]}</span>
              </Chip>
            ))}
          </ChipRow>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
      <p className="mt-4 text-xs text-bas-muted">
        Showing{" "}
        <span className="num">{tab === "sessions" ? shownSessions.length : shownJobs.length}</span> of{" "}
        {tab === "sessions" ? sessions.length : jobs.length}
      </p>

      {loading ? (
        <Skeleton rows={5} />
      ) : tab === "sessions" ? (
        <ResponsiveTable
          rows={shownSessions}
          rowKey={(s) => s.id}
          leading={(s) => <Mark name={s.agentName} />}
          mobilePrimary={(s) => s.agentName}
          mobileSecondary={(s) => (
            <div className="flex flex-wrap items-center gap-2">
              <StateBadge state={sessionState(s)} />
              {s.demo ? <span className="text-[11px]">demo</span> : null}
              <span className="num">
                {remainingCap(s)} / {s.spendCap} {s.spendToken}
              </span>
              <CopyText value={s.id} />
            </div>
          )}
          mobileActions={(s) => (
            <>
              <Button size="sm" variant="secondary" onClick={() => setOpen(s)}>
                Details
              </Button>
              {sessionState(s) === "active" ? (
                <Button size="sm" variant="danger" onClick={() => setRevokeId(s.id)}>
                  Revoke
                </Button>
              ) : null}
            </>
          )}
          columns={[
            {
              label: "Agent",
              cell: (s) => (
                <>
                  <button
                    type="button"
                    className="text-left font-medium text-bas-heading hover:text-bas-primary"
                    onClick={() => setOpen(s)}
                  >
                    {s.agentName}
                  </button>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <CopyText value={s.id} />
                    {s.demo ? (
                      <span className="rounded-[4px] border border-bas-hairline px-1.5 py-0.5 text-[10px] text-bas-muted">
                        demo
                      </span>
                    ) : null}
                  </div>
                </>
              ),
            },
            { label: "Owner", cell: (s) => <span className="num text-xs text-bas-muted">{shortAddr(s.owner)}</span> },
            {
              label: "Cap left",
              cell: (s) => (
                <span className="num">
                  {remainingCap(s)}{" "}
                  <span className="text-bas-muted">
                    / {s.spendCap} {s.spendToken}
                  </span>
                </span>
              ),
            },
            { label: "State", cell: (s) => <StateBadge state={sessionState(s)} /> },
            {
              label: "Started",
              cell: (s) => (
                <span className="num text-xs text-bas-muted">{timeAgo(new Date(atMs(s.createdAt)).toISOString())}</span>
              ),
            },
            {
              label: "",
              className: "text-right",
              cell: (s) => (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setOpen(s)}>
                    Details
                  </Button>
                  {sessionState(s) === "active" ? (
                    <Button size="sm" variant="danger" onClick={() => setRevokeId(s.id)}>
                      Revoke
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
          empty={
            sessions.length === 0 ? (
              <div className="mt-6 rounded-[12px] border border-dashed border-bas-hairline px-4 py-10 text-center">
                <p className="text-sm font-semibold text-bas-heading">No sessions yet</p>
                <p className="mt-1 text-sm text-bas-muted">Hire once, or sync this browser if the hire ran locally.</p>
                <div className="mt-4 flex justify-center">
                  <Button variant="secondary" disabled={busy} onClick={() => void syncLocal()}>
                    Sync this browser
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState title="No matching sessions" body="Clear search or switch filters." />
            )
          }
        />
      ) : (
        <ResponsiveTable
          rows={shownJobs}
          rowKey={(j) => j.id}
          leading={(j) => <Mark name={j.agentName} />}
          mobilePrimary={(j) => j.agentName}
          mobileSecondary={(j) => (
            <div className="flex flex-wrap items-center gap-2">
              <span>{j.deliverable.title}</span>
              <JobBadge status={j.status} />
              <span className="num">${j.paidUsd.toFixed(2)}</span>
            </div>
          )}
          columns={[
            {
              label: "Job",
              cell: (j) => (
                <>
                  <div className="font-medium text-bas-heading">{j.agentName}</div>
                  <div className="mt-0.5 text-xs text-bas-muted">{j.deliverable.title}</div>
                </>
              ),
            },
            {
              label: "Rail",
              cell: (j) => (
                <span className="rounded-[4px] border border-bas-hairline px-2 py-0.5 font-mono text-[11px]">
                  {j.rail}
                </span>
              ),
            },
            { label: "Paid", cell: (j) => <span className="num">${j.paidUsd.toFixed(2)}</span> },
            { label: "Status", cell: (j) => <JobBadge status={j.status} /> },
            {
              label: "When",
              cell: (j) => (
                <span className="num text-xs text-bas-muted">{timeAgo(new Date(atMs(j.startedAt)).toISOString())}</span>
              ),
            },
          ]}
          empty={
            jobs.length === 0 ? (
              <EmptyState title="No jobs" body="A hire writes a job after x402 settles." />
            ) : (
              <EmptyState title="No matching jobs" body="Clear search or switch filters." />
            )
          }
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
                    <StateBadge state={sessionState(open)} />
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
              <Row k="Owner" v={shortAddr(open.owner)} />
              <Row k="Wallet" v={shortAddr(open.wallet)} />
              <Row k="Cap left" v={`${remainingCap(open)} / ${open.spendCap} ${open.spendToken}`} />
              <Row k="Started" v={timeAgo(new Date(atMs(open.createdAt)).toISOString())} />
              <Row k="Ledger" v={open.ledgerId || "—"} />
              <Row k="Payment" v={open.paymentId || "—"} />
              {open.disputeReason ? <Row k="Dispute" v={open.disputeReason} /> : null}
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
            {open.events?.length ? (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-bas-muted">Activity</p>
                <ul className="mt-2 space-y-2 text-xs">
                  {open.events.slice(-8).reverse().map((e) => (
                    <li key={e.id} className="flex justify-between gap-3">
                      <span>
                        {e.label}
                        {e.detail ? <span className="text-bas-muted"> · {e.detail}</span> : null}
                      </span>
                      <span className="num shrink-0 text-bas-muted">{timeAgo(new Date(atMs(e.at)).toISOString())}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button size="sm" variant="secondary" href={agentPath(open.chainId, open.tokenId)}>
                View agent
              </Button>
              <Button size="sm" variant="secondary" href={altanaExplorer(open.wallet)}>
                Altana explorer
              </Button>
              {sessionState(open) === "active" ? (
                <Button size="sm" variant="danger" onClick={() => setRevokeId(open.id)}>
                  Revoke session
                </Button>
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
          onConfirm={() => void revoke(revokeId)}
        />
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-bas-muted">{k}</dt>
      <dd className="num text-right text-bas-heading">{v}</dd>
    </div>
  );
}
