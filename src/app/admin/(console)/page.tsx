"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Skeleton, StatGrid, StatusBanner } from "@/components/admin/ResponsiveTable";
import { Button } from "@/components/ui/Button";
import { auditHref, auditIso, auditLabel } from "@/lib/admin/audit";
import { adminFetch } from "@/lib/admin/client";
import { timeAgo } from "@/lib/format";

type Stats = {
  catalog: {
    totalOnBsc: number;
    listed: number;
    featured: number;
    hireable: number;
    live: number;
    uncategorized: number;
    categories: Record<string, number>;
  };
  hires: {
    sessions: number;
    active: number;
    revoked: number;
    jobs: number;
    volumeUsd: number;
  };
  receipts: number;
  payments: number;
  settings: { maintenance: boolean; notice: string; liveUrl: string; intakeSubmitted: boolean };
  recent: { id: string; at: number; action: string; detail: string }[];
  readiness: { intakeSubmitted: boolean; deployed: number; featured: number; maintenance: boolean };
};

const CAT_LABEL: Record<string, string> = {
  rebalance: "Monitoring",
  grid: "Grid",
  yield: "Yield",
  health: "Health",
  uncategorized: "Uncategorized",
};

const CAT_HREF: Record<string, string> = {
  rebalance: "/admin/catalog",
  grid: "/admin/catalog",
  yield: "/admin/catalog",
  health: "/admin/catalog",
  uncategorized: "/admin/catalog",
};

const SHORTCUTS = [
  { href: "/admin/agents/new", t: "Add seller", d: "Hireable BAS face on the public market." },
  { href: "/admin/catalog", t: "Catalog", d: "Feature, recategorize, or hide a scanned agent." },
  { href: "/admin/settings", t: "Deploy map", d: "Paste live token ids after bag deploy." },
  { href: "/admin/submission", t: "Intake", d: "Checklist and form answers for Build the Era." },
  { href: "/admin/health", t: "Health", d: "Probe 8004scan, Pancake, Altana, x402, faces." },
  { href: "/admin/hires", t: "Hires", d: "Active sessions, jobs, and revoke." },
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      setData(await adminFetch<Stats>("/api/admin/stats"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => {
      load().catch(() => null);
    }, 20_000);
    return () => window.clearInterval(t);
  }, [live]);

  if (!data && error) return <p className="text-sm text-bas-down">{error}</p>;
  if (!data) return <Skeleton rows={6} />;

  const open = !data.settings.maintenance;
  const intake = data.readiness.intakeSubmitted;
  const deploy = data.readiness.deployed;
  const featured = data.readiness.featured;
  const tone = !open ? "down" : !intake || deploy < featured ? "warn" : "up";
  const maxCat = Math.max(1, ...Object.values(data.catalog.categories));

  return (
    <div>
      <PageHeader
        title="Overview"
        desc="Live catalog from 8004scan plus BAS sellers you operate."
        actions={
          <>
            <Button variant="secondary" onClick={() => setLive((v) => !v)}>
              {live ? "Live on" : "Live off"}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void load()}>
              {busy ? "Refreshing…" : "Refresh"}
            </Button>
            <Button href="/admin/health" variant="secondary">
              Health
            </Button>
          </>
        }
      />

      <StatusBanner
        tone={tone}
        title={open ? (intake ? "Market open" : "Market open · intake still open") : "Market paused"}
        body={
          <>
            Intake {intake ? "marked submitted" : "still open"} · Deploy map {deploy}/{featured} ·{" "}
            <span className="num">{data.catalog.totalOnBsc.toLocaleString()}</span> on 8004scan
            {data.settings.notice ? <> · Banner: {data.settings.notice}</> : null}
          </>
        }
      />

      <StatGrid
        cols="grid-cols-2 lg:grid-cols-4"
        items={[
          { n: data.catalog.listed, l: "Listed agents", href: "/admin/catalog" },
          { n: data.catalog.hireable, l: "Hireable", href: "/admin/agents" },
          { n: data.catalog.live, l: "Live faces", href: "/admin/health" },
          { n: data.catalog.uncategorized, l: "Uncategorized", href: "/admin/catalog" },
          { n: data.hires.active, l: "Active sessions", href: "/admin/hires" },
          { n: data.hires.jobs, l: "Jobs delivered", href: "/admin/hires" },
          { n: `$${data.hires.volumeUsd.toFixed(2)}`, l: "x402 volume", href: "/admin/proofs" },
          { n: data.receipts + data.payments, l: "Public proofs", href: "/admin/proofs" },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[12px] border border-bas-hairline bg-bas-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-bas-heading">Category mix</h2>
            <Button size="sm" variant="secondary" href="/admin/catalog">
              Catalog
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {Object.entries(data.catalog.categories).map(([id, n]) => (
              <li key={id}>
                <Link href={CAT_HREF[id] ?? "/admin/catalog"} className="block">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-bas-heading">{CAT_LABEL[id] ?? id}</span>
                    <span className="num text-bas-muted">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-bas-surface-strong">
                    <div
                      className="h-full bg-bas-primary"
                      style={{ width: `${Math.round((n / maxCat) * 100)}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[12px] border border-bas-hairline bg-bas-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-bas-heading">Recent writes</h2>
            <Button size="sm" variant="secondary" href="/admin/activity">
              Activity
            </Button>
          </div>
          {data.recent.length === 0 ? (
            <p className="mt-3 text-sm text-bas-muted">No edits yet.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {data.recent.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={auditHref(e.action, e.detail)} className="font-medium text-bas-heading hover:text-bas-primary">
                      {auditLabel(e.action)}
                    </Link>
                    {e.detail ? <div className="num mt-0.5 truncate text-xs text-bas-muted">{e.detail}</div> : null}
                  </div>
                  <span className="num shrink-0 text-xs text-bas-muted">{timeAgo(auditIso(e.at))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-[12px] border border-bas-hairline bg-bas-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-semibold text-bas-heading">Shortcuts</h2>
          {data.settings.liveUrl ? (
            <Button size="sm" variant="secondary" href={data.settings.liveUrl}>
              Open production
            </Button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-[12px] border border-bas-hairline bg-bas-canvas p-4 hover:bg-bas-elevated"
            >
              <div className="text-sm font-medium text-bas-heading">{s.t}</div>
              <p className="mt-1 text-xs text-bas-muted">{s.d}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
