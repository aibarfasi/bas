"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CopyText } from "@/components/admin/CopyText";
import { FlagBtn } from "@/components/admin/FlagBtn";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, ResponsiveTable, SearchField, Skeleton, StatusBanner } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { CategoryBadge, FeaturedBadge, LiveBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import type { AgentPatch } from "@/lib/admin/types";
import type { MarketplaceAgent } from "@/lib/agents/types";
import { nextTrendingIds } from "@/lib/agents/trending";
import { formatUsd, shortAddr } from "@/lib/format";

type Filter = "all" | "hireable" | "featured" | "live" | "custom" | "scan";

function AgentMark({ agent }: { agent: MarketplaceAgent }) {
  if (agent.imageUrl) {
    return (
      <img
        src={agent.imageUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-[8px] object-cover"
      />
    );
  }
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-bas-elevated text-[11px] font-semibold text-bas-heading">
      {agent.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function AdminAgentsPage() {
  const toast = useToast();
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [overrides, setOverrides] = useState<Record<string, AgentPatch>>({});
  const [trendingIds, setTrendingIds] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const d = await adminFetch<{
      agents: MarketplaceAgent[];
      overrides: Record<string, AgentPatch>;
      trendingIds: string[];
    }>("/api/admin/agents");
    setAgents(d.agents);
    setOverrides(d.overrides);
    setTrendingIds(d.trendingIds ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    });
  }, []);

  const counts = useMemo(() => {
    return {
      all: agents.length,
      hireable: agents.filter((a) => a.hireable).length,
      featured: agents.filter((a) => a.featured).length,
      live: agents.filter((a) => a.live === true).length,
      custom: agents.filter((a) => a.source === "featured").length,
      scan: agents.filter((a) => a.source === "8004scan").length,
    };
  }, [agents]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return agents.filter((a) => {
      if (filter === "hireable" && !a.hireable) return false;
      if (filter === "featured" && !a.featured) return false;
      if (filter === "live" && a.live !== true) return false;
      if (filter === "custom" && a.source !== "featured") return false;
      if (filter === "scan" && a.source !== "8004scan") return false;
      if (!n) return true;
      return `${a.name} ${a.id} ${a.category} ${a.owner} ${a.source} ${overrides[a.id]?.notes ?? ""}`
        .toLowerCase()
        .includes(n);
    });
  }, [agents, q, filter, overrides]);

  async function toggleTrending(id: string) {
    const on = !trendingIds.includes(id);
    const next = nextTrendingIds(trendingIds, id, on);
    setBusy(`${id}:trending`);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ trendingIds: next }),
      });
      setTrendingIds(next);
      toast("ok", on ? "On home trending" : "Removed from trending");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function toggle(id: string, field: "hireable" | "featured") {
    const current = agents.find((a) => a.id === id);
    setBusy(`${id}:${field}`);
    try {
      await adminFetch(`/api/admin/agents/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: !current?.[field] }),
      });
      toast("ok", field === "hireable" ? (current?.hireable ? "Not hireable" : "Hireable") : current?.featured ? "Unfeatured" : "Featured");
      await load();
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "hireable", label: "Hireable" },
    { id: "featured", label: "Featured" },
    { id: "live", label: "Live" },
    { id: "custom", label: "BAS" },
    { id: "scan", label: "8004scan" },
  ];

  return (
    <div>
      <PageHeader
        title="Sellers"
        desc="Featured BAS agents plus any you add. Edits change the public market."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  "bas-sellers.csv",
                  rows.map((a) => ({
                    id: a.id,
                    name: a.name,
                    category: a.category,
                    hireable: a.hireable,
                    featured: a.featured,
                    live: a.live,
                    source: a.source,
                    price: a.priceUsd,
                    owner: a.owner,
                  })),
                )
              }
            >
              Export CSV
            </Button>
            <Button href="/admin/agents/new">Add seller</Button>
          </>
        }
      />

      <StatusBanner
        tone={counts.hireable ? "up" : "neutral"}
        title={`${counts.hireable} hireable · ${counts.live} live`}
        body={`${counts.custom} BAS sellers you operate · ${counts.scan} from 8004scan`}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            [counts.all, "Total"],
            [counts.hireable, "Hireable"],
            [counts.featured, "Featured"],
            [counts.live, "Live"],
            [counts.custom, "BAS"],
            [counts.scan, "8004scan"],
          ] as const
        ).map(([n, l]) => (
          <div key={l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
            <div className="num text-xl font-semibold text-bas-primary">{n}</div>
            <div className="mt-0.5 text-[11px] text-bas-muted">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <SearchField value={q} onChange={setQ} placeholder="Search name, id, owner" />
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
        Showing <span className="num">{rows.length}</span> of {agents.length}
      </p>

      {loading ? (
        <Skeleton rows={5} />
      ) : (
        <ResponsiveTable
          rows={rows}
          rowKey={(a) => a.id}
          leading={(a) => <AgentMark agent={a} />}
          mobilePrimary={(a) => (
            <Link href={`/admin/agents/${encodeURIComponent(a.id)}`} className="hover:text-bas-primary">
              {a.name}
            </Link>
          )}
          mobileSecondary={(a) => (
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge cat={a.category} />
              <LiveBadge live={a.live} />
              <span className="num">{formatUsd(a.priceUsd)}</span>
              {a.source === "featured" ? <FeaturedBadge /> : <span className="text-[11px]">8004scan</span>}
              <CopyText value={a.id} />
            </div>
          )}
          mobileActions={(a) => (
            <>
              <FlagBtn
                on={a.hireable}
                label="Hireable"
                onLabel="Hireable"
                offLabel="Hire"
                busy={busy === `${a.id}:hireable`}
                onClick={() => void toggle(a.id, "hireable")}
              />
              <FlagBtn
                on={a.featured}
                label="Featured"
                onLabel="Featured"
                offLabel="Feature"
                busy={busy === `${a.id}:featured`}
                onClick={() => void toggle(a.id, "featured")}
              />
              <FlagBtn
                on={trendingIds.includes(a.id)}
                label="Trending"
                onLabel="Trending"
                offLabel="Trend"
                busy={busy === `${a.id}:trending`}
                onClick={() => void toggleTrending(a.id)}
              />
              <Button size="sm" variant="secondary" href={`/admin/agents/${encodeURIComponent(a.id)}`}>
                Edit
              </Button>
            </>
          )}
          columns={[
            {
              label: "Agent",
              cell: (a) => (
                <>
                  <Link
                    href={`/admin/agents/${encodeURIComponent(a.id)}`}
                    className="font-medium text-bas-heading hover:text-bas-primary"
                  >
                    {a.name}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <CopyText value={a.id} />
                    {a.source === "featured" ? <FeaturedBadge /> : <span className="text-[11px] text-bas-muted">8004scan</span>}
                  </div>
                  {overrides[a.id]?.notes ? (
                    <p className="mt-1 max-w-xs truncate text-xs text-bas-muted">{overrides[a.id]?.notes}</p>
                  ) : null}
                </>
              ),
            },
            { label: "Category", cell: (a) => <CategoryBadge cat={a.category} /> },
            { label: "Live", cell: (a) => <LiveBadge live={a.live} /> },
            {
              label: "Market",
              cell: (a) => (
                <div className="flex flex-wrap gap-1.5">
                  <FlagBtn
                    on={a.hireable}
                    label="Hireable"
                    onLabel="Hireable"
                    offLabel="Hire"
                    busy={busy === `${a.id}:hireable`}
                    onClick={() => void toggle(a.id, "hireable")}
                  />
                  <FlagBtn
                    on={a.featured}
                    label="Featured"
                    onLabel="Featured"
                    offLabel="Feature"
                    busy={busy === `${a.id}:featured`}
                    onClick={() => void toggle(a.id, "featured")}
                  />
                  <FlagBtn
                    on={trendingIds.includes(a.id)}
                    label="Trending"
                    onLabel="Trending"
                    offLabel="Trend"
                    busy={busy === `${a.id}:trending`}
                    onClick={() => void toggleTrending(a.id)}
                  />
                </div>
              ),
            },
            {
              label: "Price",
              className: "whitespace-nowrap",
              cell: (a) => <span className="num">{formatUsd(a.priceUsd)}</span>,
            },
            {
              label: "Owner",
              cell: (a) => <span className="num text-xs text-bas-muted">{shortAddr(a.owner)}</span>,
            },
            {
              label: "",
              className: "text-right",
              cell: (a) => (
                <Button size="sm" variant="secondary" href={`/admin/agents/${encodeURIComponent(a.id)}`}>
                  Edit
                </Button>
              ),
            },
          ]}
          empty={
            agents.length === 0 ? (
              <div className="mt-6 rounded-[12px] border border-dashed border-bas-hairline px-4 py-10 text-center">
                <p className="text-sm font-semibold text-bas-heading">No sellers yet</p>
                <p className="mt-1 text-sm text-bas-muted">Add a hireable seller to list it on the public market.</p>
                <div className="mt-4 flex justify-center">
                  <Button href="/admin/agents/new">Add seller</Button>
                </div>
              </div>
            ) : (
              <EmptyState title="No matching sellers" body="Clear search or switch filters." />
            )
          }
        />
      )}
    </div>
  );
}
