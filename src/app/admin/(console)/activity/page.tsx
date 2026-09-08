"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, ResponsiveTable, SearchField, Skeleton } from "@/components/admin/ResponsiveTable";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import type { AuditEvent } from "@/lib/admin/types";
import { AUDIT_GROUP_LABEL, auditAtMs, auditGroup, auditHref, auditIso, auditLabel, type AuditGroup } from "@/lib/admin/audit";
import { timeAgo } from "@/lib/format";

type Group = "all" | AuditGroup;

function isToday(n: number) {
  return new Date(auditAtMs(n)).toDateString() === new Date().toDateString();
}

function ActionBadge({ action }: { action: string }) {
  const g = auditGroup(action);
  const danger = action.includes("delete") || action.includes("remove") || action.includes("reset");
  const ok = action.includes("create") || action.includes("add") || action.includes("import");
  const cls = danger
    ? "border-bas-down/40 bg-bas-down/10 text-bas-down"
    : ok
      ? "border-bas-up/40 bg-bas-up/10 text-bas-up"
      : "border-bas-hairline bg-bas-elevated text-bas-heading";
  return (
    <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs ${cls}`}>
      {g === "other" ? action : auditLabel(action)}
    </span>
  );
}

function KindBadge({ action }: { action: string }) {
  const g = auditGroup(action);
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-bas-hairline px-2.5 text-xs">
      {AUDIT_GROUP_LABEL[g]}
    </span>
  );
}

function Mark({ action }: { action: string }) {
  const label = auditLabel(action);
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-bas-elevated text-[11px] font-semibold text-bas-heading">
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function AdminActivityPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<Group>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);

  async function load(opts?: { quiet?: boolean }) {
    if (!opts?.quiet) setBusy(true);
    try {
      const data = await adminFetch<{ events: AuditEvent[] }>("/api/admin/activity");
      setEvents(data.events);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => {
      void load({ quiet: true });
    }, 20_000);
    return () => window.clearInterval(t);
  }, [live]);

  const counts = useMemo(() => {
    const by: Record<Group, number> = {
      all: events.length,
      settings: 0,
      sellers: 0,
      allowlist: 0,
      snapshot: 0,
      other: 0,
    };
    for (const e of events) by[auditGroup(e.action)] += 1;
    return by;
  }, [events]);

  const today = events.filter((e) => isToday(e.at)).length;
  const last = events[0] ?? null;
  const kinds = new Set(events.map((e) => e.action)).size;

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return events.filter((e) => {
      if (group !== "all" && auditGroup(e.action) !== group) return false;
      if (!n) return true;
      return `${e.action} ${auditLabel(e.action)} ${e.detail} ${e.id}`.toLowerCase().includes(n);
    });
  }, [events, q, group]);

  const filters: { id: Group; label: string }[] = [
    { id: "all", label: "All" },
    { id: "settings", label: "Settings" },
    { id: "sellers", label: "Sellers" },
    { id: "allowlist", label: "Allowlist" },
    { id: "snapshot", label: "Snapshot" },
    ...(counts.other ? ([{ id: "other", label: "Other" }] as const) : []),
  ];

  return (
    <div>
      <PageHeader
        title="Activity"
        desc="Operator audit trail for this runtime. Last 80 writes — catalog, settings, allowlist, and snapshot import."
        actions={
          <>
            <Button variant="secondary" onClick={() => setLive((v) => !v)}>
              {live ? "Live on" : "Live off"}
            </Button>
            <Button
              variant="secondary"
              disabled={!events.length}
              onClick={() =>
                downloadCsv(
                  "bas-activity.csv",
                  events.map((e) => ({
                    id: e.id,
                    at: auditIso(e.at),
                    action: e.action,
                    label: auditLabel(e.action),
                    group: auditGroup(e.action),
                    detail: e.detail,
                  })),
                )
              }
            >
              Export
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void load()}>
              {busy ? "Refreshing…" : "Refresh"}
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
              last ? "border-bas-hairline bg-bas-card" : "border-dashed border-bas-hairline bg-bas-card"
            }`}
          >
            <p className="text-sm font-semibold text-bas-heading">
              {last ? auditLabel(last.action) : "No writes yet"}
            </p>
            <p className="mt-1 text-xs text-bas-muted">
              {last ? (
                <>
                  Last write {timeAgo(auditIso(last.at))} <span className="num">· {auditIso(last.at)}</span>
                  {last.detail ? (
                    <>
                      {" "}
                      · <span className="num">{last.detail}</span>
                    </>
                  ) : null}
                </>
              ) : (
                "Edits on sellers, catalog, settings, and allowlist show up here."
              )}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                [events.length, "Writes"],
                [today, "Today"],
                [kinds, "Actions"],
                [`${events.length}/80`, "Cap"],
              ] as const
            ).map(([n, l]) => (
              <div key={l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
                <div className="num text-xl font-semibold text-bas-primary">{n}</div>
                <div className="mt-0.5 text-[11px] text-bas-muted">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <SearchField value={q} onChange={setQ} placeholder="Search action, detail, or id" />
            <ChipRow>
              {filters.map((f) => (
                <Chip key={f.id} active={group === f.id} onClick={() => setGroup(f.id)}>
                  {f.label}{" "}
                  <span className={`num ${group === f.id ? "" : "text-bas-muted"}`}>{counts[f.id]}</span>
                </Chip>
              ))}
            </ChipRow>
          </div>

          {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
          <p className="mt-4 text-xs text-bas-muted">
            Showing <span className="num">{rows.length}</span> of {events.length}
            {busy && live ? <span> · Live</span> : null}
          </p>

          <ResponsiveTable
            rows={rows}
            rowKey={(e) => e.id}
            leading={(e) => <Mark action={e.action} />}
            mobilePrimary={(e) => auditLabel(e.action)}
            mobileSecondary={(e) => (
              <div className="flex flex-wrap items-center gap-2">
                <KindBadge action={e.action} />
                <span className="num">{timeAgo(auditIso(e.at))}</span>
                {e.detail ? <CopyText value={e.detail} label={e.detail} /> : null}
              </div>
            )}
            mobileActions={(e) => (
              <Button size="sm" variant="secondary" href={auditHref(e.action, e.detail)}>
                Open
              </Button>
            )}
            columns={[
              {
                label: "Write",
                cell: (e) => (
                  <div>
                    <div className="font-medium text-bas-heading">{auditLabel(e.action)}</div>
                    <div className="num mt-0.5 text-xs text-bas-muted">{e.action}</div>
                  </div>
                ),
              },
              { label: "Group", cell: (e) => <KindBadge action={e.action} /> },
              {
                label: "Detail",
                cell: (e) => (e.detail ? <CopyText value={e.detail} label={e.detail} /> : <span className="text-bas-muted">—</span>),
              },
              {
                label: "When",
                cell: (e) => (
                  <span className="num text-xs text-bas-muted" title={auditIso(e.at)}>
                    {timeAgo(auditIso(e.at))}
                  </span>
                ),
              },
              {
                label: "",
                className: "text-right",
                cell: (e) => (
                  <Button size="sm" variant="secondary" href={auditHref(e.action, e.detail)}>
                    Open
                  </Button>
                ),
              },
            ]}
            empty={
              <EmptyState
                title={events.length ? "No matching writes" : "No writes yet"}
                body={
                  events.length
                    ? "Clear search or pick another chip."
                    : "Save settings, patch a seller, or change the allowlist to start the trail."
                }
              />
            }
          />
        </>
      )}
    </div>
  );
}
