"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { Chip, ChipRow, EmptyState, FieldInput, ResponsiveTable, Skeleton } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { CategoryBadge, LiveBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { downloadCsv } from "@/lib/admin/csv";
import { CATEGORIES, type Category, type MarketplaceAgent } from "@/lib/agents/types";
import { categoryLabel } from "@/lib/categories";
import { agentPath, shortAddr } from "@/lib/format";

type Filter = "all" | "featured" | "hireable" | "uncategorized" | "live";

export default function AdminCatalogPage() {
  const toast = useToast();
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmHide, setConfirmHide] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const rows = useMemo(() => {
    return agents.filter((a) => {
      if (filter === "featured" && !a.featured) return false;
      if (filter === "hireable" && !a.hireable) return false;
      if (filter === "uncategorized" && a.category !== "uncategorized") return false;
      if (filter === "live" && a.live !== true) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return `${a.name} ${a.tokenId} ${a.owner} ${a.category}`.toLowerCase().includes(n);
    });
  }, [agents, q, filter]);

  async function patch(id: string, body: Record<string, unknown>) {
    await adminFetch("/api/admin/catalog", {
      method: "PATCH",
      body: JSON.stringify({ id, ...body }),
    });
    toast("ok", "Catalog updated");
    await load();
  }

  async function bulk(body: Record<string, unknown>) {
    if (!selected.length) return;
    await adminFetch("/api/admin/catalog", {
      method: "PATCH",
      body: JSON.stringify({ ids: selected, ...body }),
    });
    toast("ok", `Updated ${selected.length} agents`);
    setSelected([]);
    setConfirmHide(false);
    await load();
  }

  function toggleAll() {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((a) => a.id));
  }

  return (
    <div>
      <PageHeader
        title="Catalog"
        desc="8004scan plus BAS sellers. Feature, recategorize, or hide without waiting on a deploy."
        actions={
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
                  owner: a.owner,
                  price: a.priceUsd,
                })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-3 mt-4 space-y-3 border-b border-bas-hairline bg-bas-canvas/95 px-3 py-3 backdrop-blur-md sm:-mx-4 sm:px-4 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <FieldInput value={q} onChange={setQ} placeholder="Search name, token, owner" />
        <ChipRow>
          {(["all", "featured", "hireable", "live", "uncategorized"] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </ChipRow>
      </div>
      {selected.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="num text-bas-muted">{selected.length} selected</span>
          <button type="button" className="min-h-10 text-bas-primary" onClick={() => bulk({ featured: true })}>
            Feature
          </button>
          <button type="button" className="min-h-10 text-bas-primary" onClick={() => bulk({ hireable: true })}>
            Make hireable
          </button>
          <button type="button" className="min-h-10 text-bas-down" onClick={() => setConfirmHide(true)}>
            Hide
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
      <p className="mt-3 text-xs text-bas-muted">
        Showing <span className="num">{rows.length}</span> of {agents.length}
        {rows.length ? (
          <>
            {" · "}
            <button type="button" className="text-bas-primary" onClick={toggleAll}>
              {selected.length === rows.length ? "Clear" : "Select all"}
            </button>
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
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={selected.includes(a.id)}
              onChange={() =>
                setSelected((cur) =>
                  cur.includes(a.id) ? cur.filter((id) => id !== a.id) : [...cur, a.id],
                )
              }
            />
          )}
          mobilePrimary={(a) => (
            <Link href={agentPath(a.chainId, a.tokenId)} className="hover:text-bas-primary">
              {a.name}
            </Link>
          )}
          mobileSecondary={(a) => (
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge cat={a.category} />
              <LiveBadge live={a.live} />
              <CopyText value={a.id} />
            </div>
          )}
          mobileActions={(a) => (
            <>
              <select
                value={a.category}
                onChange={(e) => patch(a.id, { category: e.target.value as Category })}
                className="h-10 rounded-[6px] border border-bas-hairline bg-bas-canvas px-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c)}
                  </option>
                ))}
              </select>
              <button type="button" className="text-bas-primary" onClick={() => patch(a.id, { featured: !a.featured })}>
                {a.featured ? "Unfeature" : "Feature"}
              </button>
              <button type="button" className="text-bas-primary" onClick={() => patch(a.id, { hireable: !a.hireable })}>
                {a.hireable ? "Unhire" : "Hireable"}
              </button>
              <button type="button" className="text-bas-down" onClick={() => patch(a.id, { hidden: true })}>
                Hide
              </button>
            </>
          )}
          columns={[
            {
              label: "Agent",
              cell: (a) => (
                <>
                  <Link href={agentPath(a.chainId, a.tokenId)} className="text-bas-heading hover:text-bas-primary">
                    {a.name}
                  </Link>
                  <div>
                    <CopyText value={a.id} />
                  </div>
                </>
              ),
            },
            {
              label: "Category",
              cell: (a) => (
                <>
                  <select
                    value={a.category}
                    onChange={(e) => patch(a.id, { category: e.target.value as Category })}
                    className="h-8 rounded-[6px] border border-bas-hairline bg-bas-canvas px-2 text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabel(c)}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1">
                    <CategoryBadge cat={a.category} />
                  </div>
                </>
              ),
            },
            { label: "Live", cell: (a) => <LiveBadge live={a.live} /> },
            { label: "Owner", cell: (a) => <span className="num text-xs">{shortAddr(a.owner)}</span> },
            {
              label: "Actions",
              cell: (a) => (
                <div className="space-x-2 text-xs">
                  <button type="button" className="text-bas-primary" onClick={() => patch(a.id, { featured: !a.featured })}>
                    {a.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button type="button" className="text-bas-primary" onClick={() => patch(a.id, { hireable: !a.hireable })}>
                    {a.hireable ? "Unhire" : "Make hireable"}
                  </button>
                  <button type="button" className="text-bas-down" onClick={() => patch(a.id, { hidden: true })}>
                    Hide
                  </button>
                </div>
              ),
            },
          ]}
          empty={<EmptyState title="No agents match" body="Clear the search or switch filters." />}
        />
      )}
      {confirmHide ? (
        <Confirm
          title="Hide selected agents"
          body={`Remove ${selected.length} agents from the public market. You can reset overrides later.`}
          confirm="Hide"
          danger
          onCancel={() => setConfirmHide(false)}
          onConfirm={() => bulk({ hidden: true })}
        />
      ) : null}
    </div>
  );
}
