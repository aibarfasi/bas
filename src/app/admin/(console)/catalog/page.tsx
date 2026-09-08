"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { CopyText } from "@/components/admin/CopyText";
import { FlagBtn } from "@/components/admin/FlagBtn";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, ResponsiveTable, SearchField, Skeleton, StatusBanner } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { FeaturedBadge, LiveBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import { CATEGORIES, type MarketplaceAgent } from "@/lib/agents/types";
import { categoryLabel } from "@/lib/categories";
import { agentPath, formatUsd, shortAddr } from "@/lib/format";

type Filter = "all" | "featured" | "hireable" | "live" | "uncategorized" | "custom";

function AgentMark({ agent }: { agent: MarketplaceAgent }) {
  if (agent.imageUrl) {
    return <img src={agent.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" />;
  }
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-bas-elevated text-[11px] font-semibold text-bas-heading">
      {agent.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function AdminCatalogPage() {
  const toast = useToast();
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmHide, setConfirmHide] = useState<null | "bulk" | string>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const data = await adminFetch<{ agents: MarketplaceAgent[] }>("/api/admin/catalog");
    setAgents(data.agents);
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
      featured: agents.filter((a) => a.featured).length,
      hireable: agents.filter((a) => a.hireable).length,
      live: agents.filter((a) => a.live === true).length,
      uncategorized: agents.filter((a) => a.category === "uncategorized").length,
      custom: agents.filter((a) => a.source === "featured").length,
    };
  }, [agents]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return agents.filter((a) => {
      if (filter === "featured" && !a.featured) return false;
      if (filter === "hireable" && !a.hireable) return false;
      if (filter === "uncategorized" && a.category !== "uncategorized") return false;
      if (filter === "live" && a.live !== true) return false;
      if (filter === "custom" && a.source !== "featured") return false;
      if (!n) return true;
      return `${a.name} ${a.tokenId} ${a.id} ${a.owner} ${a.category} ${a.source}`.toLowerCase().includes(n);
    });
  }, [agents, q, filter]);

  async function patch(id: string, body: Record<string, unknown>, ok = "Catalog updated") {
    setBusy(id);
    try {
      await adminFetch("/api/admin/catalog", {
        method: "PATCH",
        body: JSON.stringify({ id, ...body }),
      });
      toast("ok", ok);
      await load();
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function bulk(body: Record<string, unknown>) {
    if (!selected.length) return;
    setBusy("bulk");
    try {
      await adminFetch("/api/admin/catalog", {
        method: "PATCH",
        body: JSON.stringify({ ids: selected, ...body }),
      });
      toast("ok", `Updated ${selected.length} agents`);
      setSelected([]);
      setConfirmHide(null);
      await load();
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function toggleAll() {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((a) => a.id));
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "featured", label: "Featured" },
    { id: "hireable", label: "Hireable" },
    { id: "live", label: "Live" },
    { id: "uncategorized", label: "Uncategorized" },
    { id: "custom", label: "BAS" },
  ];

  const hideTarget = confirmHide && confirmHide !== "bulk" ? agents.find((a) => a.id === confirmHide) : null;

  return (
    <div>
      <PageHeader
        title="Catalog"
        desc="8004scan plus BAS sellers. Feature, recategorize, or hide without waiting on a deploy."
        actions={
          <>
            <Button href="/admin/agents/new" variant="secondary">
              Add seller
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  "bas-catalog.csv",
                  rows.map((a) => ({
                    id: a.id,
                    name: a.name,
                    category: a.category,
                    featured: a.featured,
                    hireable: a.hireable,
                    live: a.live,
                    source: a.source,
                    owner: a.owner,
                    price: a.priceUsd,
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
        tone={counts.uncategorized ? "warn" : "up"}
        title={`${counts.all} listed · ${counts.live} live`}
        body={`${counts.featured} featured · ${counts.uncategorized} uncategorized · ${counts.custom} BAS`}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            [counts.all, "Total"],
            [counts.featured, "Featured"],
            [counts.hireable, "Hireable"],
            [counts.live, "Live"],
            [counts.uncategorized, "Uncategorized"],
            [counts.custom, "BAS"],
          ] as const
        ).map(([n, l]) => (
          <div key={l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
            <div className="num text-xl font-semibold text-bas-primary">{n}</div>
            <div className="mt-0.5 text-[11px] text-bas-muted">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <SearchField value={q} onChange={setQ} placeholder="Search name, token, owner" />
        <ChipRow>
          {filters.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}{" "}
              <span className={`num ${filter === f.id ? "" : "text-bas-muted"}`}>{counts[f.id]}</span>
            </Chip>
          ))}
        </ChipRow>
      </div>

      {selected.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[12px] border border-bas-hairline bg-bas-card p-3">
          <span className="text-sm text-bas-heading">
            <span className="num font-semibold">{selected.length}</span> selected
          </span>
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            <Button size="sm" variant="secondary" disabled={busy === "bulk"} onClick={() => void bulk({ featured: true })}>
              Feature
            </Button>
            <Button size="sm" variant="secondary" disabled={busy === "bulk"} onClick={() => void bulk({ hireable: true })}>
              Make hireable
            </Button>
            <Button size="sm" variant="danger" disabled={busy === "bulk"} onClick={() => setConfirmHide("bulk")}>
              Hide
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
      <p className="mt-4 text-xs text-bas-muted">
        Showing <span className="num">{rows.length}</span> of {agents.length}
        {rows.length ? (
          <>
            {" · "}
            <Button size="sm" variant="ghost" onClick={toggleAll}>
              {selected.length === rows.length ? "Clear selection" : "Select all"}
            </Button>
          </>
        ) : null}
      </p>

      {loading ? (
        <Skeleton rows={5} />
      ) : (
        <ResponsiveTable
          rows={rows}
          rowKey={(a) => a.id}
          leading={(a) => (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-bas-primary"
                checked={selected.includes(a.id)}
                onChange={() => toggleSelect(a.id)}
                aria-label={`Select ${a.name}`}
              />
              <AgentMark agent={a} />
            </div>
          )}
          mobilePrimary={(a) => (
            <Link href={agentPath(a.chainId, a.tokenId)} className="hover:text-bas-primary">
              {a.name}
            </Link>
          )}
          mobileSecondary={(a) => (
            <div className="flex flex-wrap items-center gap-2">
              <LiveBadge live={a.live} />
              <span className="num">{formatUsd(a.priceUsd)}</span>
              {a.source === "featured" ? <FeaturedBadge /> : <span className="text-[11px]">8004scan</span>}
              <CopyText value={a.id} />
            </div>
          )}
          mobileActions={(a) => (
            <>
              <AdminSelect
                aria-label="Category"
                size="sm"
                className="w-full max-w-[14rem]"
                value={a.category}
                disabled={busy === a.id}
                onChange={(v) => void patch(a.id, { category: v }, "Category updated")}
                options={CATEGORIES.map((c) => ({ id: c, label: categoryLabel(c) }))}
              />
              <FlagBtn
                on={a.featured}
                label="Featured"
                onLabel="Featured"
                offLabel="Feature"
                busy={busy === a.id}
                onClick={() => void patch(a.id, { featured: !a.featured }, a.featured ? "Unfeatured" : "Featured")}
              />
              <FlagBtn
                on={a.hireable}
                label="Hireable"
                onLabel="Hireable"
                offLabel="Hire"
                busy={busy === a.id}
                onClick={() => void patch(a.id, { hireable: !a.hireable }, a.hireable ? "Not hireable" : "Hireable")}
              />
              <Button size="sm" variant="danger" disabled={busy === a.id} onClick={() => setConfirmHide(a.id)}>
                Hide
              </Button>
            </>
          )}
          columns={[
            {
              label: "Agent",
              cell: (a) => (
                <>
                  <Link
                    href={agentPath(a.chainId, a.tokenId)}
                    className="font-medium text-bas-heading hover:text-bas-primary"
                  >
                    {a.name}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <CopyText value={a.id} />
                    {a.source === "featured" ? <FeaturedBadge /> : <span className="text-[11px] text-bas-muted">8004scan</span>}
                  </div>
                </>
              ),
            },
            {
              label: "Category",
              cell: (a) => (
                <AdminSelect
                  aria-label="Category"
                  size="sm"
                  className="max-w-[11rem]"
                  value={a.category}
                  disabled={busy === a.id}
                  onChange={(v) => void patch(a.id, { category: v }, "Category updated")}
                  options={CATEGORIES.map((c) => ({ id: c, label: categoryLabel(c) }))}
                />
              ),
            },
            { label: "Live", cell: (a) => <LiveBadge live={a.live} /> },
            {
              label: "Market",
              cell: (a) => (
                <div className="flex flex-wrap gap-1.5">
                  <FlagBtn
                    on={a.featured}
                    label="Featured"
                    onLabel="Featured"
                    offLabel="Feature"
                    busy={busy === a.id}
                    onClick={() => void patch(a.id, { featured: !a.featured }, a.featured ? "Unfeatured" : "Featured")}
                  />
                  <FlagBtn
                    on={a.hireable}
                    label="Hireable"
                    onLabel="Hireable"
                    offLabel="Hire"
                    busy={busy === a.id}
                    onClick={() => void patch(a.id, { hireable: !a.hireable }, a.hireable ? "Not hireable" : "Hireable")}
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
                <Button size="sm" variant="danger" disabled={busy === a.id} onClick={() => setConfirmHide(a.id)}>
                  Hide
                </Button>
              ),
            },
          ]}
          empty={<EmptyState title="No agents match" body="Clear the search or switch filters." />}
        />
      )}
      {confirmHide === "bulk" ? (
        <Confirm
          title="Hide selected agents"
          body={`Remove ${selected.length} agents from the public market. You can reset overrides later.`}
          confirm="Hide"
          danger
          onCancel={() => setConfirmHide(null)}
          onConfirm={() => void bulk({ hidden: true })}
        />
      ) : null}
      {hideTarget ? (
        <Confirm
          title={`Hide ${hideTarget.name}?`}
          body="It drops off the public market. You can restore it from overrides later."
          confirm="Hide"
          danger
          onCancel={() => setConfirmHide(null)}
          onConfirm={() => {
            setConfirmHide(null);
            void patch(hideTarget.id, { hidden: true }, "Hidden");
          }}
        />
      ) : null}
    </div>
  );
}
