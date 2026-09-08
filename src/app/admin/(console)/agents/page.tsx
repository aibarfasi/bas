"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CopyText } from "@/components/admin/CopyText";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState, FieldInput, ResponsiveTable, Skeleton } from "@/components/admin/ResponsiveTable";
import { useToast } from "@/components/admin/Toast";
import { CategoryBadge, LiveBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import type { AgentPatch } from "@/lib/admin/types";
import type { MarketplaceAgent } from "@/lib/agents/types";
import { formatUsd } from "@/lib/format";

export default function AdminAgentsPage() {
  const toast = useToast();
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [overrides, setOverrides] = useState<Record<string, AgentPatch>>({});
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const d = await adminFetch<{ agents: MarketplaceAgent[]; overrides: Record<string, AgentPatch> }>(
      "/api/admin/agents",
    );
    setAgents(d.agents);
    setOverrides(d.overrides);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    });
  }, []);

  const rows = useMemo(() => {
    if (!q) return agents;
    const n = q.toLowerCase();
    return agents.filter((a) => `${a.name} ${a.id} ${a.category}`.toLowerCase().includes(n));
  }, [agents, q]);

  async function toggle(id: string, field: "hireable" | "featured" | "live") {
    const current = agents.find((a) => a.id === id);
    await adminFetch(`/api/admin/agents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: field === "live" ? current?.live !== true : !current?.[field] }),
    });
    toast("ok", `${field} updated`);
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Sellers"
        desc="Featured BAS agents plus any you add. Edits change the public market."
        actions={<Button href="/admin/agents/new">Add seller</Button>}
      />
      <div className="mt-4">
        <FieldInput value={q} onChange={setQ} placeholder="Search sellers" />
      </div>
      {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
      {loading ? (
        <Skeleton />
      ) : (
        <ResponsiveTable
          rows={rows}
          rowKey={(a) => a.id}
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
              <CopyText value={a.id} />
            </div>
          )}
          mobileActions={(a) => (
            <>
              <button type="button" className="text-bas-primary" onClick={() => toggle(a.id, "hireable")}>
                {a.hireable ? "Unhire" : "Hireable"}
              </button>
              <button type="button" className="text-bas-primary" onClick={() => toggle(a.id, "featured")}>
                {a.featured ? "Unfeature" : "Feature"}
              </button>
              <Link href={`/admin/agents/${encodeURIComponent(a.id)}`} className="text-bas-heading">
                Edit
              </Link>
            </>
          )}
          columns={[
            {
              label: "Agent",
              cell: (a) => (
                <>
                  <Link
                    href={`/admin/agents/${encodeURIComponent(a.id)}`}
                    className="text-bas-heading hover:text-bas-primary"
                  >
                    {a.name}
                  </Link>
                  <div className="text-xs text-bas-muted">{overrides[a.id]?.notes || a.source}</div>
                </>
              ),
            },
            { label: "Category", cell: (a) => <CategoryBadge cat={a.category} /> },
            {
              label: "Flags",
              cell: (a) => (
                <div className="space-x-2">
                  <LiveBadge live={a.live} />
                  {a.hireable ? <span className="text-xs text-bas-up">Hire</span> : null}
                  {a.featured ? <span className="text-xs text-bas-primary">Featured</span> : null}
                </div>
              ),
            },
            { label: "Price", cell: (a) => <span className="num">{formatUsd(a.priceUsd)}</span> },
            {
              label: "Quick",
              cell: (a) => (
                <div className="space-x-2 text-xs">
                  <button type="button" className="text-bas-primary" onClick={() => toggle(a.id, "hireable")}>
                    {a.hireable ? "Unhire" : "Hireable"}
                  </button>
                  <button type="button" className="text-bas-primary" onClick={() => toggle(a.id, "featured")}>
                    {a.featured ? "Unfeature" : "Feature"}
                  </button>
                </div>
              ),
            },
          ]}
          empty={<EmptyState title="No sellers" body="Add a hireable seller or clear search." />}
        />
      )}
    </div>
  );
}
