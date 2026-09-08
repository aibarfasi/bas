"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Confirm } from "@/components/admin/Confirm";
import { PageHeader } from "@/components/admin/PageHeader";
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

  async function load() {
    const data = await adminFetch<{ agents: MarketplaceAgent[] }>("/api/admin/catalog");
    setAgents(data.agents);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
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
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, token, owner"
          className="h-10 w-full max-w-md rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(["all", "featured", "hireable", "live", "uncategorized"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-9 rounded-[6px] px-3 text-xs ${
                filter === f ? "bg-bas-primary text-bas-on-primary" : "bg-bas-card"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {selected.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="num text-bas-muted">{selected.length} selected</span>
          <button type="button" className="text-bas-primary" onClick={() => bulk({ featured: true })}>
            Feature
          </button>
          <button type="button" className="text-bas-primary" onClick={() => bulk({ hireable: true })}>
            Make hireable
          </button>
          <button type="button" className="text-bas-down" onClick={() => setConfirmHide(true)}>
            Hide
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-bas-down">{error}</p> : null}
      <p className="mt-3 text-xs text-bas-muted">
        Showing <span className="num">{rows.length}</span> of {agents.length}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-xs text-bas-muted">
            <tr>
              <th className="pb-2 font-medium">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="pb-2 font-medium">Agent</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Live</th>
              <th className="pb-2 font-medium">Owner</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-bas-hairline">
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(a.id)}
                    onChange={() =>
                      setSelected((cur) =>
                        cur.includes(a.id) ? cur.filter((id) => id !== a.id) : [...cur, a.id],
                      )
                    }
                  />
                </td>
                <td>
                  <Link href={agentPath(a.chainId, a.tokenId)} className="text-bas-heading hover:text-bas-primary">
                    {a.name}
                  </Link>
                  <div className="num text-xs text-bas-muted">{a.id}</div>
                </td>
                <td>
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
                </td>
                <td>
                  <LiveBadge live={a.live} />
                </td>
                <td className="num text-xs">{shortAddr(a.owner)}</td>
                <td className="space-x-2 text-xs">
                  <button
                    type="button"
                    className="text-bas-primary"
                    onClick={() => patch(a.id, { featured: !a.featured })}
                  >
                    {a.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    type="button"
                    className="text-bas-primary"
                    onClick={() => patch(a.id, { hireable: !a.hireable })}
                  >
                    {a.hireable ? "Unhire" : "Make hireable"}
                  </button>
                  <button type="button" className="text-bas-down" onClick={() => patch(a.id, { hidden: true })}>
                    Hide
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
