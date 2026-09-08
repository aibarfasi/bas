"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
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

  async function load() {
    const d = await adminFetch<{ agents: MarketplaceAgent[]; overrides: Record<string, AgentPatch> }>(
      "/api/admin/agents",
    );
    setAgents(d.agents);
    setOverrides(d.overrides);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
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
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search sellers"
        className="mt-4 h-10 w-full max-w-md rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-sm"
      />
      {error ? <p className="mt-4 text-sm text-bas-down">{error}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-xs text-bas-muted">
            <tr>
              <th className="pb-2 font-medium">Agent</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Flags</th>
              <th className="pb-2 font-medium">Price</th>
              <th className="pb-2 font-medium">Quick</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-bas-hairline">
                <td className="py-3">
                  <Link
                    href={`/admin/agents/${encodeURIComponent(a.id)}`}
                    className="text-bas-heading hover:text-bas-primary"
                  >
                    {a.name}
                  </Link>
                  <div className="text-xs text-bas-muted">{overrides[a.id]?.notes || a.source}</div>
                </td>
                <td>
                  <CategoryBadge cat={a.category} />
                </td>
                <td className="space-x-2">
                  <LiveBadge live={a.live} />
                  {a.hireable ? <span className="text-xs text-bas-up">Hire</span> : null}
                  {a.featured ? <span className="text-xs text-bas-primary">Featured</span> : null}
                </td>
                <td className="num">{formatUsd(a.priceUsd)}</td>
                <td className="space-x-2 text-xs">
                  <button type="button" className="text-bas-primary" onClick={() => toggle(a.id, "hireable")}>
                    {a.hireable ? "Unhire" : "Hireable"}
                  </button>
                  <button type="button" className="text-bas-primary" onClick={() => toggle(a.id, "featured")}>
                    {a.featured ? "Unfeature" : "Feature"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
