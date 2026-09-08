"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, ResponsiveTable, SearchField, Skeleton } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import { timeAgo } from "@/lib/format";

type Check = { id: string; ok: boolean; detail: string; ms: number };
type Filter = "all" | "passing" | "failing" | "rails" | "faces";

const RAIL_META: Record<string, { label: string; hint: string; href: string }> = {
  "8004scan": { label: "8004scan index", hint: "Agent registry", href: "/admin/catalog" },
  pancake: { label: "Pancake quote", hint: "Smart Router", href: "/admin/allowlist" },
  altana: { label: "Altana receipts", hint: "Grant ledger", href: "/admin/proofs" },
  x402: { label: "x402 payments", hint: "Pay-to-hire", href: "/admin/proofs" },
};

const FACE_LABEL: Record<string, string> = {
  rebalance: "Monitoring",
  grid: "Grid",
  yield: "Yield",
  health: "Health",
  equities: "Equities",
};

function isFace(id: string) {
  return id.startsWith("face:");
}

function faceKind(id: string) {
  return id.slice(5);
}

function checkLabel(id: string) {
  if (RAIL_META[id]) return RAIL_META[id].label;
  if (isFace(id)) return `${FACE_LABEL[faceKind(id)] ?? faceKind(id)} face`;
  return id;
}

function checkHint(id: string) {
  if (RAIL_META[id]) return RAIL_META[id].hint;
  if (isFace(id)) return "A2A 200 · x402 402";
  return "";
}

function checkHref(id: string) {
  if (RAIL_META[id]) return RAIL_META[id].href;
  if (isFace(id)) return "/admin/catalog";
  return "/admin";
}

function initials(id: string) {
  if (isFace(id)) return (FACE_LABEL[faceKind(id)] ?? faceKind(id)).slice(0, 2).toUpperCase();
  return id.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs ${
        ok
          ? "border-bas-up/40 bg-bas-up/10 text-bas-up"
          : "border-bas-down/40 bg-bas-down/10 text-bas-down"
      }`}
    >
      {ok ? "Passing" : "Failing"}
    </span>
  );
}

function KindBadge({ id }: { id: string }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-bas-hairline px-2.5 text-xs">
      {isFace(id) ? "Face" : "Rail"}
    </span>
  );
}

function ProbeMark({ id, ok }: { id: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[11px] font-semibold ${
        ok ? "bg-bas-up/10 text-bas-up" : "bg-bas-down/10 text-bas-down"
      }`}
    >
      {initials(id)}
    </span>
  );
}

function LatencyBar({ ms, max }: { ms: number; max: number }) {
  const pct = Math.max(6, Math.round((ms / Math.max(1, max)) * 100));
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bas-surface-strong">
        <div className="h-full bg-bas-primary" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="num w-14 shrink-0 text-xs text-bas-muted">{ms}ms</span>
    </div>
  );
}

export default function AdminHealthPage() {
  const toast = useToast();
  const [checks, setChecks] = useState<Check[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  async function run(opts?: { quiet?: boolean }) {
    setBusy(true);
    setError(null);
    try {
      const data = await adminFetch<{ ok: boolean; checkedAt: string; checks: Check[] }>(
        "/api/admin/health",
      );
      setChecks(data.checks);
      setOk(data.ok);
      setAt(data.checkedAt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Health check failed";
      setError(msg);
      if (!opts?.quiet) toast("err", msg);
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    void run();
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => {
      void run({ quiet: true });
    }, 20_000);
    return () => window.clearInterval(t);
  }, [live]);

  const counts = useMemo(() => {
    const passing = checks.filter((c) => c.ok).length;
    const failing = checks.filter((c) => !c.ok).length;
    const rails = checks.filter((c) => !isFace(c.id)).length;
    const faces = checks.filter((c) => isFace(c.id)).length;
    return { all: checks.length, passing, failing, rails, faces };
  }, [checks]);

  const slowest = useMemo(() => {
    if (!checks.length) return null;
    return checks.reduce((a, b) => (a.ms >= b.ms ? a : b));
  }, [checks]);

  const maxMs = Math.max(1, ...checks.map((c) => c.ms));

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return checks.filter((c) => {
      if (filter === "passing" && !c.ok) return false;
      if (filter === "failing" && c.ok) return false;
      if (filter === "rails" && isFace(c.id)) return false;
      if (filter === "faces" && !isFace(c.id)) return false;
      if (!n) return true;
      return `${c.id} ${checkLabel(c.id)} ${checkHint(c.id)} ${c.detail}`.toLowerCase().includes(n);
    });
  }, [checks, q, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "passing", label: "Passing" },
    { id: "failing", label: "Failing" },
    { id: "rails", label: "Rails" },
    { id: "faces", label: "Faces" },
  ];

  const failed = checks.filter((c) => !c.ok);

  return (
    <div>
      <PageHeader
        title="Health"
        desc="Probe 8004scan, Pancake quotes, Altana receipts, x402, and every BAS seller face."
        actions={
          <>
            <Button variant="secondary" onClick={() => setLive((v) => !v)}>
              {live ? "Live on" : "Live off"}
            </Button>
            <Button
              variant="secondary"
              disabled={!checks.length}
              onClick={() =>
                downloadCsv(
                  "bas-health.csv",
                  checks.map((c) => ({
                    id: c.id,
                    label: checkLabel(c.id),
                    kind: isFace(c.id) ? "face" : "rail",
                    ok: c.ok,
                    ms: c.ms,
                    detail: c.detail,
                    checkedAt: at ?? "",
                  })),
                )
              }
            >
              Export
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void run()}>
              {busy ? "Checking…" : "Re-run"}
            </Button>
          </>
        }
      />

      {loading ? (
        <Skeleton rows={6} />
      ) : (
        <>
          <div
            className={`mt-5 rounded-[12px] border p-4 ${
              ok
                ? "border-bas-up/40 bg-bas-up/10"
                : ok === false
                  ? "border-bas-down/40 bg-bas-down/10"
                  : "border-bas-hairline bg-bas-card"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    ok ? "text-bas-up" : ok === false ? "text-bas-down" : "text-bas-heading"
                  }`}
                >
                  {ok == null
                    ? "Probes not run"
                    : ok
                      ? "All rails responding"
                      : `${counts.failing} rail${counts.failing === 1 ? "" : "s"} failed`}
                </p>
                <p className="mt-1 text-xs text-bas-muted">
                  {at ? (
                    <>
                      Last check {timeAgo(at)}{" "}
                      <span className="num">· {at}</span>
                    </>
                  ) : (
                    "Run probes to see rail status."
                  )}
                  {slowest ? (
                    <>
                      {" "}
                      · Slowest {checkLabel(slowest.id)}{" "}
                      <span className="num">{slowest.ms}ms</span>
                    </>
                  ) : null}
                </p>
              </div>
              {busy ? <span className="text-xs text-bas-muted">Checking…</span> : null}
            </div>
            {failed.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {failed.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full border border-bas-down/40 bg-bas-card px-2.5 py-1 text-xs text-bas-down"
                  >
                    {checkLabel(c.id)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                [counts.passing, "Passing"],
                [counts.failing, "Failing"],
                [slowest ? `${slowest.ms}ms` : "—", "Slowest"],
                [counts.all, "Checks"],
              ] as const
            ).map(([n, l]) => (
              <div key={l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
                <div className="num text-xl font-semibold text-bas-primary">{n}</div>
                <div className="mt-0.5 text-[11px] text-bas-muted">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <SearchField value={q} onChange={setQ} placeholder="Search rail, face, or detail" />
            <ChipRow>
              {filters.map((f) => (
                <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}{" "}
                  <span className={`num ${filter === f.id ? "" : "text-bas-muted"}`}>{counts[f.id]}</span>
                </Chip>
              ))}
            </ChipRow>
          </div>

          {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
          <p className="mt-4 text-xs text-bas-muted">
            Showing <span className="num">{rows.length}</span> of {checks.length}
          </p>

          <ResponsiveTable
            rows={rows}
            rowKey={(c) => c.id}
            leading={(c) => <ProbeMark id={c.id} ok={c.ok} />}
            mobilePrimary={(c) => checkLabel(c.id)}
            mobileSecondary={(c) => (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge ok={c.ok} />
                <KindBadge id={c.id} />
                <span className="num">{c.ms}ms</span>
                <CopyText value={c.detail} label={c.detail} />
              </div>
            )}
            mobileActions={(c) => (
              <Button size="sm" variant="secondary" href={checkHref(c.id)}>
                Open
              </Button>
            )}
            columns={[
              {
                label: "Probe",
                cell: (c) => (
                  <div>
                    <div className="font-medium text-bas-heading">{checkLabel(c.id)}</div>
                    <div className="mt-0.5 text-xs text-bas-muted">{checkHint(c.id)}</div>
                  </div>
                ),
              },
              { label: "Kind", cell: (c) => <KindBadge id={c.id} /> },
              { label: "Status", cell: (c) => <StatusBadge ok={c.ok} /> },
              {
                label: "Latency",
                cell: (c) => <LatencyBar ms={c.ms} max={maxMs} />,
              },
              {
                label: "Detail",
                cell: (c) => <CopyText value={c.detail} label={c.detail} />,
              },
              {
                label: "",
                className: "text-right",
                cell: (c) => (
                  <Button size="sm" variant="secondary" href={checkHref(c.id)}>
                    Open
                  </Button>
                ),
              },
            ]}
            empty={
              <EmptyState
                title={checks.length ? "No matching probes" : "No probes yet"}
                body={
                  checks.length
                    ? "Clear search or pick another chip."
                    : "Re-run to probe 8004scan, Pancake, Altana, x402, and seller faces."
                }
              />
            }
          />
        </>
      )}
    </div>
  );
}
