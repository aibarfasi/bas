"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Skeleton } from "@/components/admin/ResponsiveTable";
import { Button } from "@/components/ui/Button";
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

export default function AdminOverviewPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  async function load() {
    setData(await adminFetch<Stats>("/api/admin/stats"));
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => {
      load().catch(() => null);
    }, 20_000);
    return () => window.clearInterval(t);
  }, [live]);

  if (error) return <p className="text-sm text-bas-down">{error}</p>;
  if (!data) return <Skeleton rows={6} />;

  const cards = [
    { n: data.catalog.listed, l: "Listed agents", href: "/admin/catalog" },
    { n: data.catalog.hireable, l: "Hireable", href: "/admin/agents" },
    { n: data.catalog.live, l: "Live faces", href: "/admin/health" },
    { n: data.catalog.uncategorized, l: "Uncategorized", href: "/admin/catalog" },
    { n: data.hires.active, l: "Active sessions", href: "/admin/hires" },
    { n: data.hires.jobs, l: "Jobs delivered", href: "/admin/hires" },
    { n: `$${data.hires.volumeUsd.toFixed(2)}`, l: "x402 volume", href: "/admin/proofs" },
    { n: data.receipts + data.payments, l: "Public proofs", href: "/admin/proofs" },
  ];
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
            <Button variant="secondary" onClick={() => load().catch(() => null)}>
              Refresh
            </Button>
            <Button href="/admin/health" variant="secondary">
              Health
            </Button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span className={data.settings.maintenance ? "text-bas-down" : "text-bas-up"}>
          {data.settings.maintenance ? "Maintenance on" : "Market open"}
        </span>
        <span className={data.readiness.intakeSubmitted ? "text-bas-up" : "text-bas-down"}>
          Intake {data.readiness.intakeSubmitted ? "marked submitted" : "still open"}
        </span>
        <span className="text-bas-muted">
          Deploy map {data.readiness.deployed}/{data.readiness.featured}
        </span>
        <span className="num text-bas-muted">
          {data.catalog.totalOnBsc.toLocaleString()} on 8004scan
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.l}
            href={c.href}
            className="rounded-[12px] bg-bas-card p-4 hover:bg-bas-elevated"
          >
            <div className="num text-2xl font-bold text-bas-primary">{c.n}</div>
            <div className="mt-1 text-xs text-bas-muted">{c.l}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[12px] bg-bas-card p-5">
          <h2 className="font-semibold text-bas-heading">Category mix</h2>
          <ul className="mt-4 space-y-3">
            {Object.entries(data.catalog.categories).map(([id, n]) => (
              <li key={id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{CAT_LABEL[id] ?? id}</span>
                  <span className="num text-bas-muted">{n}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bas-surface-strong">
                  <div
                    className="h-full bg-bas-primary"
                    style={{ width: `${Math.round((n / maxCat) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[12px] bg-bas-card p-5">
          <h2 className="font-semibold text-bas-heading">Recent operator actions</h2>
          {data.recent.length === 0 ? (
            <p className="mt-3 text-sm text-bas-muted">No edits yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.recent.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span>
                    {e.action} <span className="text-bas-muted">{e.detail}</span>
                  </span>
                  <span className="num shrink-0 text-bas-muted">
                    {timeAgo(new Date(e.at).toISOString())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-[12px] bg-bas-card p-5">
        <h2 className="font-semibold text-bas-heading">Shortcuts</h2>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/admin/agents/new" className="text-bas-primary">
            Add a hireable seller
          </Link>
          <Link href="/admin/settings" className="text-bas-primary">
            Paste bag-deploy token ids
          </Link>
          <Link href="/admin/catalog" className="text-bas-primary">
            Feature or hide a scanned agent
          </Link>
          <Link href="/admin/submission" className="text-bas-primary">
            Submission checklist
          </Link>
          <a href={data.settings.liveUrl} className="text-bas-primary">
            Open production
          </a>
        </div>
        {data.settings.notice ? (
          <p className="mt-4 text-sm text-bas-muted">Banner: {data.settings.notice}</p>
        ) : null}
      </section>
    </div>
  );
}
